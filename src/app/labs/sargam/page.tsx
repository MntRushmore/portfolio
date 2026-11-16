import { LabShell } from "@/components/LabShell";
import { LabTrack } from "@/components/LabTrack";
import { labMetadata } from "@/lib/labs";
import { SargamLab } from "./SargamLab";

export const metadata = labMetadata("sargam");

export default function SargamPage() {
  return (
    <LabShell slug="sargam">
      <LabTrack lab="sargam" />
      <SargamLab />
    </LabShell>
  );
}
