import logo from "../../assets/logo/logo.png";
import {
  Users,
  Megaphone,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import "./auth.css";

const features = [
  { title: "Leads", icon: Users },
  { title: "Campaigns", icon: Megaphone },
  { title: "Admissions", icon: GraduationCap },
  { title: "Learning", icon: BookOpen },
];

const LoginBanner = () => {
  return (
    <section className="auth-banner hidden lg:flex">
      <div className="auth-banner__top">
        <div className="auth-brand">
          <div className="auth-brand__logo">
            <img src={logo} alt="IEM LMS" />
          </div>
          <div className="auth-brand__text">
            <h1>IEM</h1>
            <p>Institute of Event Management</p>
          </div>
        </div>

        <div className="auth-banner__headline">
          <h2>One platform for modern education operations.</h2>
          <p>
            Streamline admissions, campaigns, leads, and learning programs in one secure,
            beautifully organized environment.
          </p>
        </div>
      </div>

      <div className="auth-banner__stats">
        {features.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="auth-stat-card">
              <Icon size={24} />
              <h3>{item.title}</h3>
              <span>Connected workflows</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default LoginBanner;
