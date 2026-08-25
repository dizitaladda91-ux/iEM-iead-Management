import "./SummaryCards.css";

import {
    Users,
    PhoneCall,
    BadgeCheck,
    GraduationCap,
} from "lucide-react";

import SummaryCard from "./SummaryCard";

const SummaryCards = ({ summary = {} }) => {

    const cards = [
        {
            title: "Assigned Leads",
            value: summary.assigned_leads ?? 0,
            icon: <Users size={28} />,
            color: "blue",
            link: "/employee/my-leads",
        },
        {
            title: "Today's Follow-ups",
            value: summary.today_followups ?? 0,
            icon: <PhoneCall size={28} />,
            color: "orange",
            link: "/employee/followups",
        },
        {
            title: "Interested Leads",
            value: summary.interested_leads ?? 0,
            icon: <BadgeCheck size={28} />,
            color: "green",
            link: "/employee/my-leads",
        },
        {
            title: "Admissions",
            value: summary.admissions ?? 0,
            icon: <GraduationCap size={28} />,
            color: "purple",
            link: "/employee/admissions",
        },
    ];

    return (
        <div className="summary-cards">
            {cards.map((card) => (
                <SummaryCard
                    key={card.title}
                    title={card.title}
                    value={card.value}
                    icon={card.icon}
                    color={card.color}
                    link={card.link}
                />
            ))}
        </div>
    );

};

export default SummaryCards;