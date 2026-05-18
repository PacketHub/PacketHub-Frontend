import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Camera, Upload, Save, User, KeyRound, Mail, AtSign, Cpu } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/gif";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [specCpu, setSpecCpu] = useState("");
  const [specGpu, setSpecGpu] = useState("");
  const [specRam, setSpecRam] = useState("");
  const [specStorage, setSpecStorage] = useState("");
  const [specOs, setSpecOs] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) fetchProfile();
  }, [user, authLoading]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (data) {
      setProfile(data);
      setDisplayName(data.display_name ?? "");
      setUsername(data.username ?? "");
      setBio(data.bio ?? "");
      const p = data as unknown as Record<string, string | null>;
      setSpecCpu(p.spec_cpu ?? "");
      setSpecGpu(p.spec_gpu ?? "");
      setSpecRam(p.spec_ram ?? "");
      setSpecStorage(p.spec_storage ?? "");
      setSpecOs(p.spec_os ?? "");
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        spec_cpu: specCpu.trim() || null,
        spec_gpu: specGpu.trim() || null,
        spec_ram: specRam.trim() || null,
        spec_storage: specStorage.trim() || null,
        spec_os: specOs.trim() || null,
      } as never)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      if (error.message.includes("unique") || error.code === "23505") {
        toast.error("That username is already taken");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Profile updated!");
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      toast.error("Please enter a new email");
      return;
    }
    setChangingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setChangingEmail(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Confirmation email sent! Check both old and new inboxes.");
      setNewEmail("");
    }
  };

  const uploadFile = async (
    file: File,
    bucket: "avatars" | "banners",
    setUploading: (v: boolean) => void
  ) => {
    if (!user) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File must be under 5MB");
      return;
    }

    const isAnimated = file.type === "image/gif";
    const ext = file.name.split(".").pop() ?? "png";
    const filePath = `${user.id}/${Date.now()}.${ext}`;

    setUploading(true);
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const updateData =
      bucket === "avatars"
        ? { avatar_url: urlData.publicUrl, avatar_is_animated: isAnimated }
        : { banner_url: urlData.publicUrl, banner_is_animated: isAnimated };

    await supabase.from("profiles").update(updateData).eq("user_id", user.id);
    await fetchProfile();
    setUploading(false);
    toast.success(`${bucket === "avatars" ? "Avatar" : "Banner"} updated!`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-8 animate-fade-in">
        {/* Banner */}
        <div className="relative mb-16 h-48 md:h-56">
          <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-secondary">
            {profile?.banner_url ? (
              <img
                src={profile.banner_url}
                alt="Banner"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="font-display text-sm text-muted-foreground">No banner yet</p>
              </div>
            )}
            <button
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg border border-border bg-card/90 px-3 py-1.5 font-display text-xs text-foreground backdrop-blur-sm transition-colors hover:bg-card"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploadingBanner ? "Uploading..." : "Change Banner"}
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file, "banners", setUploadingBanner);
              }}
            />
          </div>


          {/* Avatar overlapping banner */}
          <div className="absolute -bottom-12 left-6">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-background bg-secondary">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity hover:opacity-100"
              >
                <Camera className="h-6 w-6 text-foreground" />
              </button>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file, "avatars", setUploadingAvatar);
              }}
            />
          </div>
        </div>

        {/* Profile info */}
        <div className="space-y-6">
          <div>
            <p className="font-display text-lg font-semibold text-foreground">
              {profile?.display_name || profile?.username}
            </p>
            <p className="text-sm text-muted-foreground">
              @{profile?.username} · Member since{" "}
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : ""}
            </p>
          </div>

          {/* Profile Details Section */}
          <div className="glass space-y-4 rounded-xl border border-border p-6">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
              <User className="h-4 w-4 text-primary" />
              Profile Details
            </h2>

            <div className="space-y-2">
              <Label htmlFor="username" className="font-display text-sm">
                Username
              </Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={30}
                  className="bg-secondary border-border pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="font-display text-sm">
                Display Name
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="font-display text-sm">
                Bio
              </Label>
              <Textarea
                id="bio"
                placeholder="Tell the community about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={4}
                className="bg-secondary border-border resize-none"
              />
            </div>

            <div className="space-y-3 rounded-lg border border-border/60 bg-secondary/30 p-4">
              <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold text-foreground">
                <Cpu className="h-3.5 w-3.5 text-primary" />
                PC / Laptop Specs
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { id: "spec_cpu", label: "CPU", value: specCpu, setter: setSpecCpu, placeholder: "e.g. Ryzen 7 5800X" },
                  { id: "spec_gpu", label: "GPU", value: specGpu, setter: setSpecGpu, placeholder: "e.g. RTX 4070" },
                  { id: "spec_ram", label: "RAM", value: specRam, setter: setSpecRam, placeholder: "e.g. 32GB DDR4 3600" },
                  { id: "spec_storage", label: "Storage", value: specStorage, setter: setSpecStorage, placeholder: "e.g. 1TB NVMe + 2TB HDD" },
                  { id: "spec_os", label: "OS", value: specOs, setter: setSpecOs, placeholder: "e.g. Windows 11" },
                ].map((f) => (
                  <div key={f.id} className="space-y-1.5">
                    <Label htmlFor={f.id} className="font-display text-xs text-muted-foreground">
                      {f.label}
                    </Label>
                    <Input
                      id={f.id}
                      value={f.value}
                      onChange={(e) => f.setter(e.target.value)}
                      placeholder={f.placeholder}
                      maxLength={120}
                      className="bg-background border-border"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave any field blank to hide it on your public profile.
              </p>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="gap-1.5 font-display text-sm"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>

          <Separator className="bg-border" />

          {/* Change Email Section */}
          <div className="glass space-y-4 rounded-xl border border-border p-6">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
              <Mail className="h-4 w-4 text-primary" />
              Change Email
            </h2>
            <p className="text-xs text-muted-foreground">
              Current email: {user?.email}
            </p>

            <div className="space-y-2">
              <Label htmlFor="newEmail" className="font-display text-sm">
                New Email
              </Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@email.com"
                className="bg-secondary border-border"
              />
            </div>

            <Button
              onClick={handleChangeEmail}
              disabled={changingEmail}
              variant="secondary"
              className="gap-1.5 font-display text-sm"
            >
              <Mail className="h-4 w-4" />
              {changingEmail ? "Sending..." : "Update Email"}
            </Button>
          </div>

          <Separator className="bg-border" />

          {/* Change Password Section */}
          <div className="glass space-y-4 rounded-xl border border-border p-6">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
              <KeyRound className="h-4 w-4 text-primary" />
              Change Password
            </h2>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="font-display text-sm">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-display text-sm">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="bg-secondary border-border"
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              variant="secondary"
              className="gap-1.5 font-display text-sm"
            >
              <KeyRound className="h-4 w-4" />
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            💡 Tip: Upload a GIF for an animated avatar or banner!
          </p>
        </div>
      </main>
    </div>
  );
};

export default Profile;
