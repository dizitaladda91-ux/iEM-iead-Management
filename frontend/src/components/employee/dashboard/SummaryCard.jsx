import { useNavigate } from "react-router-dom";
import "./SummaryCard.css";

const SummaryCard = ({
    title,
    value,
    icon,
    color,
    link,
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (link) {
            navigate(link);
        }
    };

    return (
        <div
            className={`summary-card ${link ? "clickable" : ""}`}
            onClick={handleClick}
            role="button"
            tabIndex={0}
        >
            <div className="summary-card-top">
                <div>
                    <span className="summary-title">
                        {title}
                    </span>
                    <h2 className="summary-value">
                        {value}
                    </h2>
                </div>
                <div className={`summary-icon ${color}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default SummaryCard;