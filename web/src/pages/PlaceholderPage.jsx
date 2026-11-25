import { Construction } from "lucide-react"
import AppShell from "../components/layouts/AppShell"
import { EmptyState, SectionHeading } from "../components/ui/foundation"

export default function PlaceholderPage({ title, description, member = false }) {
  return <AppShell member={member}><SectionHeading eyebrow={member ? "Member portal" : "Workspace"} title={title} description={description} /><EmptyState icon={Construction} title={`${title} is ready for implementation`} description="This Phase 2 structure is intentionally empty. Data, calculations, and workflows will be added in a later phase." /></AppShell>
}
