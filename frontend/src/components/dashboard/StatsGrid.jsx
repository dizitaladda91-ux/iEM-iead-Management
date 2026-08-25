import { useNavigate } from "react-router-dom";
import "../../styles/Dashboard/StatsGrid.css";

import {
  Users,
  GraduationCap,
  IndianRupee,
  Briefcase,
  Megaphone,
  UserCheck,
  ArrowUpRight,
} from "lucide-react";

const StatsGrid = ({
  summary = {},
  loading = false,
}) => {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Total Leads",
      value: Number(summary.total_leads || 0),
      subtitle: `${Number(summary.today_leads || 0)} Today`,
      icon: Users,
      color: "blue",
      path: "/leads",
    },

    {
      title: "Campaigns",
      value: Number(summary.total_campaigns || 0),
      subtitle: "Running Campaigns",
      icon: Megaphone,
      color: "purple",
      path: "/campaigns",
    },

    {
      title: "Admissions",
      value: Number(summary.total_admissions || 0),
      subtitle: "Confirmed Admissions",
      icon: GraduationCap,
      color: "green",
      path: "/admissions",
    },

    {
      title: "Fees Collected",
      value: `₹${Number(summary.total_fees_collected || 0).toLocaleString("en-IN")}`,
      subtitle: "Total Fee Revenue",
      icon: IndianRupee,
      color: "orange",
      path: "/admissions",
    },

    {
      title: "Employees",
      value: Number(summary.total_employees || 0),
      subtitle: "CRM Staff & Counsellors",
      icon: Briefcase,
      color: "red",
      path: "/employees",
    },

    {
      title: "Assigned Leads",
      value: Number(summary.assigned_leads || 0),
      subtitle: "Assigned To Counsellors",
      icon: UserCheck,
      color: "cyan",
      path: "/leads",
    },

  ];

  return (

    <section className="stats-grid">

      {

        cards.map((card) => {

          const Icon = card.icon;

          return (

            <div
              key={card.title}
              className={`stat-card ${card.color} active-stat-card`}
              onClick={() => navigate(card.path)}
              role="button"
              tabIndex={0}
              title={`Click to view ${card.title}`}
            >

              <div className="stat-header">

                <div>

                  <p className="stat-title">

                    {card.title}

                  </p>

                  <h2 className="stat-value">

                    {

                      loading

                        ? "--"

                        : card.value

                    }

                  </h2>

                  <span className="stat-subtitle">

                    {card.subtitle}

                  </span>

                </div>

                <div className="stat-icon">

                  <Icon size={26} />

                </div>

              </div>

            </div>

          );

        })

      }

    </section>

  );

};

export default StatsGrid;