import "./SearchFilterBar.css";
import {
    Search,
    RotateCcw
} from "lucide-react";

const SearchFilterBar = () => {

    return (

        <div className="search-filter-bar">

            <div className="search-box">

                <Search size={18} />

                <input
                    type="text"
                    placeholder="Search by name, mobile or email..."
                />

            </div>

            <select>
                <option value="">All Statuses</option>
                <option value="INTERESTED">Interested</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="VISITED">Visited</option>
                <option value="ENROLLED">Enrolled</option>
                <option value="NOT_INTERESTED">Not Interested</option>
                <option value="NEW">New Lead</option>
            </select>

            <select>
                <option>All Courses</option>
            </select>

            <select>
                <option>Priority</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
            </select>

            <button className="reset-filter-btn">

                <RotateCcw size={18} />

                Reset

            </button>

        </div>

    );

};

export default SearchFilterBar;