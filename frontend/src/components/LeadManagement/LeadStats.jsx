import "../../styles/LeadManagement/LeadStats.css";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Target,
  Sparkles,
} from "lucide-react";

const LeadStats = ({
  stats = {},
  loading = false,
  activeFilter = {},
  onCardClick = () => {},
}) => {
  const cards = [
    {
      id: "ALL",
      title: "Total Leads",
      value: Number(stats.total_leads || 0),
      subtitle: "All Active Inquiries",
      icon: Users,
      color: "blue",
      filter: { status: "", assigned_to: "", date_range: "" },
    },
    {
      id: "TODAY",
      title: "Today's Leads",
      value: Number(stats.today_leads || 0),
      subtitle: "Captured Today",
      icon: UserPlus,
      color: "green",
      filter: { date_range: "today" },
    },
    {
      id: "ASSIGNED",
      title: "Assigned Leads",
      value: Number(stats.assigned_leads || 0),
      subtitle: "With Counsellors",
      icon: UserCheck,
      color: "purple",
      filter: { assigned_to: "ASSIGNED" },
    },
    {
      id: "UNASSIGNED",
      title: "Unassigned Leads",
      value: Number(stats.unassigned_leads || 0),
      subtitle: "Action Required",
      icon: UserX,
      color: "orange",
      filter: { assigned_to: "UNASSIGNED" },
    },
    {
      id: "ENROLLED",
      title: "Converted Students",
      value: Number(stats.enrolled_leads || stats.converted_leads || 0),
      subtitle: "Enrolled & Paid",
      icon: Target,
      color: "cyan",
      filter: { status: "ENROLLED" },
    },
  ];

  return (
    <section className="lead-stats">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected =
          (card.id === "UNASSIGNED" && activeFilter?.assigned_to === "UNASSIGNED") ||
          (card.id === "TODAY" && activeFilter?.date_range === "today") ||
          (card.id === "ENROLLED" && activeFilter?.status === "ENROLLED");

        return (
          <div
            key={card.title}
            className={`lead-stat-card ${card.color} ${isSelected ? "selected-card" : ""}`}
            onClick={() => onCardClick(card.filter)}
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer" }}
            title={`Click to filter leads by ${card.title}`}
          >
            <div className="lead-stat-top">
              <div>
                <span>{card.title}</span>
                <h2>{loading ? "--" : card.value}</h2>
                <p>{card.subtitle}</p>
              </div>

              <div className="lead-stat-icon">
                <Icon size={24} />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default LeadStats;
