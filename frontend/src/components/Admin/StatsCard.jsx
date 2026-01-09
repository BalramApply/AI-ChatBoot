import Styles from "./styles/StatsCard.module.css";

const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const getColorClass = () => {
    switch(color) {
      case 'blue': return Styles.iconBlue;
      case 'green': return Styles.iconGreen;
      case 'purple': return Styles.iconPurple;
      case 'orange': return Styles.iconOrange;
      case 'red': return Styles.iconRed;
      default: return Styles.iconBlue;
    }
  };

  return (
    <div className={Styles.card}>
      <div className={Styles.cardContent}>
        <div className={Styles.textContent}>
          <p className={Styles.title}>{title}</p>
          <h3 className={Styles.value}>{value}</h3>
          {subtitle && (
            <p className={Styles.subtitle}>{subtitle}</p>
          )}
          {trend && (
            <div className={Styles.trendContainer}>
              <span className={`${Styles.trendValue} ${trend.isPositive ? Styles.trendPositive : Styles.trendNegative}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className={Styles.trendLabel}>vs last week</span>
            </div>
          )}
        </div>
        <div className={`${Styles.iconContainer} ${getColorClass()}`}>
          <Icon className={Styles.icon} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;