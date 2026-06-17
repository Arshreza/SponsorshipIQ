import { FestProfileForm } from "@/components/fest-profiles/fest-profile-form";

export default function NewFestProfilePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Fest Profile</h1>
        <p className="text-foreground-muted text-sm mt-1">
          Fill in your festival details. This powers the AI-generated pitches for each sponsor.
        </p>
      </div>
      <FestProfileForm />
    </div>
  );
}
