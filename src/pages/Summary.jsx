import { useParams, Link } from "react-router-dom";

export default function Summary() {
    const { day } = useParams();
    return (
        <div style={{ padding: 24 }}>
            <h1>Lesson Summary — Day {day}</h1>
            <p>Here we will show your corrections, timing, and transcript.</p>
            <Link
                to="/lesson"
                className="btn btn-dark"
                style={{ display: "inline-block", marginTop: 16 }}
            >
                Back to Lessons
            </Link>
        </div>
    );
}
