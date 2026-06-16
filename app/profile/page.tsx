"use client";

// Next.js 16 App Router client component.
// useRouter from 'next/navigation' (docs: use-router.md).
// Profile page: view/edit name, bio, timezone, avatar; change password; account info.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAcademy } from "@/lib/store/AcademyProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  updateProfile,
  uploadAvatarComplete,
  recordPasswordChange,
} from "@/lib/profile/api";
import { formatDateShort } from "@/lib/time";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// IANA timezone list (common zones for US + global coverage)
// ---------------------------------------------------------------------------

const TIMEZONE_OPTIONS: { label: string; value: string }[] = [
  { label: "Pacific Time (US)", value: "America/Los_Angeles" },
  { label: "Mountain Time (US)", value: "America/Denver" },
  { label: "Central Time (US)", value: "America/Chicago" },
  { label: "Eastern Time (US)", value: "America/New_York" },
  { label: "Alaska Time", value: "America/Anchorage" },
  { label: "Hawaii Time", value: "Pacific/Honolulu" },
  { label: "Atlantic Time", value: "America/Halifax" },
  { label: "Bogota / Lima / Quito", value: "America/Bogota" },
  { label: "Mexico City", value: "America/Mexico_City" },
  { label: "Sao Paulo", value: "America/Sao_Paulo" },
  { label: "Buenos Aires", value: "America/Argentina/Buenos_Aires" },
  { label: "UTC", value: "UTC" },
  { label: "London (GMT)", value: "Europe/London" },
  { label: "Madrid / Paris / Berlin", value: "Europe/Madrid" },
  { label: "Dubai", value: "Asia/Dubai" },
  { label: "Mumbai", value: "Asia/Kolkata" },
  { label: "Singapore / Kuala Lumpur", value: "Asia/Singapore" },
  { label: "Tokyo / Seoul", value: "Asia/Tokyo" },
  { label: "Sydney", value: "Australia/Sydney" },
];

// ---------------------------------------------------------------------------
// Toast helper
// ---------------------------------------------------------------------------

function Toast({
  message,
  type = "success",
}: {
  message: string | null;
  type?: "success" | "error";
}) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "mt-3 rounded-xl px-4 py-2.5 text-sm font-medium",
        type === "success"
          ? "bg-success/10 text-success"
          : "bg-red-50 text-red-700",
      )}
    >
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card 1: Profile info
// ---------------------------------------------------------------------------

interface ProfileData {
  bio: string;
  timezone: string;
  avatar_url: string | null;
}

function ProfileCard({
  userId,
  userName,
  userAvatar,
  profileData,
  onProfileUpdated,
}: {
  userId: string;
  userName: string;
  userAvatar: string;
  profileData: ProfileData | null;
  onProfileUpdated: () => void;
}) {
  const [name, setName] = useState(userName);
  const [bio, setBio] = useState(profileData?.bio ?? "");
  const [timezone, setTimezone] = useState(
    profileData?.timezone ?? "America/Los_Angeles",
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profileData?.avatar_url ?? null,
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "done" | "error"
  >("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Tracks the current object URL created for the avatar preview so it can be
  // revoked (avoids a memory leak; createObjectURL holds the file in memory).
  const previewUrlRef = useRef<string | null>(null);

  // Revoke any outstanding preview object URL when the component unmounts.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  // Sync when profileData loads
  useEffect(() => {
    if (profileData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBio(profileData.bio);
      setTimezone(profileData.timezone);
      setAvatarUrl(profileData.avatar_url);
    }
  }, [profileData]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(userName);
  }, [userName]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 80) {
      setSaveError("Name must be between 2 and 80 characters.");
      return;
    }
    if (bio.length > 300) {
      setSaveError("Bio must be at most 300 characters.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setToast(null);

    const result = await updateProfile({
      name: trimmedName,
      bio,
      timezone,
    });

    setSaving(false);

    if (!result.ok) {
      setSaveError(result.error ?? "Failed to save. Please try again.");
    } else {
      setToast("Profile updated.");
      onProfileUpdated();
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only JPG, PNG, or WebP files are accepted.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Photo must be under 2 MB.");
      return;
    }

    // Immediate preview. Revoke any prior preview URL before creating a new one.
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setAvatarPreview(previewUrl);
    setUploadError(null);
    setUploadStatus("uploading");

    try {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/avatar.${ext}`;

      const sb = getSupabaseBrowserClient();
      const { error: uploadErr } = await sb.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = sb.storage.from("avatars").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const result = await uploadAvatarComplete(publicUrl);
      if (!result.ok) throw new Error(result.error ?? "Avatar save failed.");

      setAvatarUrl(publicUrl);
      setUploadStatus("done");
      // Upload succeeded: the persisted public URL replaces the local preview,
      // so revoke the object URL to free memory.
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setAvatarPreview(null);
      onProfileUpdated();
      setTimeout(() => setUploadStatus("idle"), 3000);
    } catch (err) {
      setUploadStatus("error");
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
      );
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setAvatarPreview(null);
    }
  };

  const displayAvatar = avatarPreview ?? avatarUrl;

  return (
    <section className="card p-6">
      <h2 className="mb-5 text-lg font-semibold text-ink-900">Profile info</h2>

      {/* Avatar */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          {displayAvatar ? (
            <Image
              src={displayAvatar}
              alt="Profile photo"
              width={56}
              height={56}
              unoptimized
              className="h-14 w-14 rounded-full object-cover ring-1 ring-line"
            />
          ) : (
            <Avatar emoji={userAvatar} size="lg" />
          )}
          <button
            type="button"
            aria-label="Change profile photo"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center",
              "rounded-full border border-line bg-white shadow-sm",
              "hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
            )}
          >
            <Camera className="h-3.5 w-3.5 text-ink-500" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Upload profile photo"
            onChange={handleFileChange}
          />
        </div>

        <div className="text-sm">
          {uploadStatus === "uploading" && (
            <span className="flex items-center gap-1.5 text-ink-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Uploading...
            </span>
          )}
          {uploadStatus === "done" && (
            <span className="text-success">Photo updated.</span>
          )}
          {uploadError && (
            <span role="alert" className="text-red-600">
              {uploadError}
            </span>
          )}
          {uploadStatus === "idle" && !uploadError && (
            <span className="text-ink-300">JPG, PNG, or WebP. Max 2 MB.</span>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="profile-name"
            className="text-sm font-semibold text-ink-700"
          >
            Full name
          </label>
          <input
            id="profile-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => { setName(e.target.value); setSaveError(null); }}
            placeholder="Your name"
            className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="profile-bio"
              className="text-sm font-semibold text-ink-700"
            >
              Bio
            </label>
            <span className="text-[11px] text-ink-300">
              {bio.length} / 300
            </span>
          </div>
          <textarea
            id="profile-bio"
            rows={3}
            maxLength={300}
            value={bio}
            onChange={(e) => { setBio(e.target.value); setSaveError(null); }}
            placeholder="Tell your partners a little about yourself..."
            className="w-full resize-none rounded-xl border border-line bg-surface-2 px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* Timezone */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="profile-timezone"
            className="text-sm font-semibold text-ink-700"
          >
            Timezone
          </label>
          <select
            id="profile-timezone"
            value={timezone}
            onChange={(e) => { setTimezone(e.target.value); setSaveError(null); }}
            className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {saveError && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {saveError}
        </p>
      )}

      <Toast message={toast} type="success" />

      <div className="mt-5">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="md"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Card 2: Change password
// ---------------------------------------------------------------------------

function ChangePasswordCard({
  userEmail,
}: {
  userEmail: string;
}) {
  const router = useRouter();

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!currentPwd) return "Current password is required.";
    if (!newPwd) return "New password is required.";
    if (newPwd.length < 8) return "New password must be at least 8 characters.";
    if (newPwd === currentPwd) return "New password must be different from your current password.";
    if (confirmPwd !== newPwd) return "Passwords do not match.";
    return null;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const valErr = validate();
    if (valErr) { setError(valErr); return; }

    setSaving(true);
    setError(null);

    const sb = getSupabaseBrowserClient();

    // Step 1: re-verify current password
    const { error: reAuthError } = await sb.auth.signInWithPassword({
      email: userEmail,
      password: currentPwd,
    });

    if (reAuthError) {
      setSaving(false);
      setError("Current password is incorrect.");
      return;
    }

    // Step 2: update password
    const { error: updateError } = await sb.auth.updateUser({ password: newPwd });

    if (updateError) {
      setSaving(false);
      setError(updateError.message);
      return;
    }

    // Step 3: audit
    await recordPasswordChange();

    // Step 4: sign out and redirect
    await sb.auth.signOut();
    router.push("/login?msg=password-changed");
  };

  return (
    <section className="card p-6">
      <h2 className="mb-1 text-lg font-semibold text-ink-900">Change password</h2>
      <p className="mb-5 text-sm text-ink-500">
        You will be signed out and asked to sign in again.
      </p>

      <form onSubmit={handleUpdate} className="flex flex-col gap-4" noValidate>
        {/* Current password */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="current-pwd"
            className="text-sm font-semibold text-ink-700"
          >
            Current password
          </label>
          <input
            id="current-pwd"
            type="password"
            autoComplete="current-password"
            value={currentPwd}
            onChange={(e) => { setCurrentPwd(e.target.value); setError(null); }}
            placeholder="••••••••"
            className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* New password */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="new-pwd"
            className="text-sm font-semibold text-ink-700"
          >
            New password
          </label>
          <input
            id="new-pwd"
            type="password"
            autoComplete="new-password"
            value={newPwd}
            onChange={(e) => { setNewPwd(e.target.value); setError(null); }}
            placeholder="Min. 8 characters"
            className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* Confirm new password */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="confirm-pwd"
            className="text-sm font-semibold text-ink-700"
          >
            Confirm new password
          </label>
          <input
            id="confirm-pwd"
            type="password"
            autoComplete="new-password"
            value={confirmPwd}
            onChange={(e) => { setConfirmPwd(e.target.value); setError(null); }}
            placeholder="Repeat your new password"
            className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div>
          <Button type="submit" disabled={saving} size="md">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Card 3: Account info (readonly)
// ---------------------------------------------------------------------------

function AccountInfoCard({
  email,
  joinedAt,
  timezone,
  role,
}: {
  email: string;
  joinedAt: string;
  timezone: string;
  role: string;
}) {
  const rows: { label: string; value: string; note?: string }[] = [
    {
      label: "Email",
      value: email,
      note: "To update your email, contact an administrator.",
    },
    {
      label: "Member since",
      value: formatDateShort(joinedAt),
    },
    {
      label: "Timezone",
      value: timezone,
    },
    {
      label: "Role",
      value: role.charAt(0).toUpperCase() + role.slice(1),
    },
  ];

  return (
    <section className="card p-6">
      <h2 className="mb-4 text-lg font-semibold text-ink-900">Account info</h2>
      <dl className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-sm font-semibold text-ink-700">{row.label}</dt>
            <dd className="mt-0.5 text-[15px] text-ink-500">{row.value}</dd>
            {row.note && (
              <p className="mt-0.5 text-[12px] text-ink-300">{row.note}</p>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="card p-6">
      <div className="h-5 w-32 animate-pulse rounded-lg bg-surface-3" />
      <div className="mt-4 flex flex-col gap-3">
        <div className="h-10 animate-pulse rounded-xl bg-surface-3" />
        <div className="h-20 animate-pulse rounded-xl bg-surface-3" />
        <div className="h-10 animate-pulse rounded-xl bg-surface-3" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  const router = useRouter();
  const { authLoading, currentUser } = useAcademy();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfileData = useCallback(async (userId: string) => {
    const sb = getSupabaseBrowserClient();
    const { data } = await sb
      .from("profiles")
      .select("bio, timezone, avatar_url")
      .eq("id", userId)
      .single();

    if (data) {
      setProfileData({
        bio: (data as { bio: string | null }).bio ?? "",
        timezone:
          (data as { timezone: string | null }).timezone ??
          "America/Los_Angeles",
        avatar_url: (data as { avatar_url: string | null }).avatar_url ?? null,
      });
    }
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProfileData(currentUser.id);
  }, [authLoading, currentUser, fetchProfileData, router]);

  // Show spinner while auth resolves
  if (authLoading || (profileLoading && !profileData)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 h-8 w-24 animate-pulse rounded-lg bg-surface-3" />
        <div className="flex flex-col gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl">Profile</h1>

      <div className="flex flex-col gap-6">
        <ProfileCard
          userId={currentUser.id}
          userName={currentUser.name}
          userAvatar={currentUser.avatar}
          profileData={profileData}
          onProfileUpdated={() => void fetchProfileData(currentUser.id)}
        />

        <ChangePasswordCard userEmail={currentUser.email} />

        <AccountInfoCard
          email={currentUser.email}
          joinedAt={currentUser.joinedAt}
          timezone={profileData?.timezone ?? "America/Los_Angeles"}
          role={currentUser.role}
        />
      </div>
    </div>
  );
}
