import { useNavigate } from "react-router-dom";
import "./TodayFollowups.css";
import { PhoneCall, Clock3 } from "lucide-react";

const TodayFollowups = ({ followUps = [] }) => {
    const navigate = useNavigate();

    return (
        <div className="followup-card">
            <div className="followup-header">
                <h3>Today's Follow-ups</h3>
                <button
                    className="followup-view-btn"
                    onClick={() => navigate("/employee/followups")}
                >
                    View All
                </button>
            </div>

            {
                followUps.length === 0 ? (

                    <div className="followup-empty">

                        <Clock3 size={48} />

                        <h4>No Follow-ups Today</h4>

                        <p>
                            All scheduled follow-ups will appear here.
                        </p>

                    </div>

                ) : (

                    <div className="followup-list">

                        {
                            followUps.map((item) => (

                                <div
                                    className="followup-item"
                                    key={item.id}
                                >

                                    <div className="followup-info">

                                        <h4>
                                            {item.full_name}
                                        </h4>

                                        <span>

                                            {item.mobile}

                                        </span>

                                    </div>

                                    <div className="followup-right">

                                        <small>

                                            {item.next_followup}

                                        </small>

                                        <button>

                                            <PhoneCall size={16} />

                                        </button>

                                    </div>

                                </div>

                            ))
                        }

                    </div>

                )
            }

        </div>

    );

};

export default TodayFollowups;