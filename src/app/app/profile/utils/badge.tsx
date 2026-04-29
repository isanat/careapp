import { Badge } from "@/components/ui/badge";
import { IconCheckCircle, IconClock, IconAlertTriangle } from "@/components/icons";
import { getBadgeClasses } from "@/lib/design-tokens";

export function getBackgroundCheckBadge(status?: string) {
  switch (status) {
    case "VERIFIED":
      return (
        <Badge
          className={getBadgeClasses("success")}
          variant="outline"
        >
          <IconCheckCircle className="h-3 w-3 mr-1" />
          Verificado
        </Badge>
      );
    case "SUBMITTED":
      return (
        <Badge
          className={getBadgeClasses("warning")}
          variant="outline"
        >
          <IconClock className="h-3 w-3 mr-1" />
          Em analise
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="destructive">
          <IconAlertTriangle className="h-3 w-3 mr-1" />
          Rejeitado
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <IconClock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      );
  }
}
