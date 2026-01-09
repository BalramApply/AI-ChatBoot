import Styles from "./styles/ActivityChart.module.css";

const ActivityChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className={Styles.chartContainer}>
        <h3 className={Styles.chartTitle}>Activity Overview</h3>
        <div className={Styles.emptyState}>No activity data available</div>
      </div>
    );
  }

  // Calculate max value for scaling
  const maxMessages = Math.max(...data.map(d => d.messages));
  const maxChats = Math.max(...data.map(d => d.chats));
  const maxValue = Math.max(maxMessages, maxChats);

  return (
    <div className={Styles.chartContainer}>
      <h3 className={Styles.chartTitle}>Activity Overview (Last 7 Days)</h3>
      
      <div className={Styles.chartContent}>
        {data.map((item, index) => {
          const messageHeight = (item.messages / maxValue) * 100;
          const chatHeight = (item.chats / maxValue) * 100;
          const date = new Date(item.date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          
          return (
            <div key={index} className={Styles.chartRow}>
              <div className={Styles.dayLabel}>{dayName}</div>
              
              <div className={Styles.barsContainer}>
                {/* Messages Bar */}
                <div className={Styles.barWrapper}>
                  <div 
                    className={Styles.barMessages}
                    style={{ height: `${messageHeight}%`, minHeight: item.messages > 0 ? '8px' : '0' }}
                  >
                    <div className={Styles.tooltip}>
                      {item.messages} messages
                    </div>
                  </div>
                </div>
                
                {/* Chats Bar */}
                <div className={Styles.barWrapper}>
                  <div 
                    className={Styles.barChats}
                    style={{ height: `${chatHeight}%`, minHeight: item.chats > 0 ? '8px' : '0' }}
                  >
                    <div className={Styles.tooltip}>
                      {item.chats} chats
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={Styles.statsLabel}>
                <span>{item.messages} msgs</span>
                <span>{item.chats} chats</span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className={Styles.legend}>
        <div className={Styles.legendItem}>
          <div className={Styles.legendColorMessages}></div>
          <span className={Styles.legendText}>Messages</span>
        </div>
        <div className={Styles.legendItem}>
          <div className={Styles.legendColorChats}></div>
          <span className={Styles.legendText}>Chats</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityChart;