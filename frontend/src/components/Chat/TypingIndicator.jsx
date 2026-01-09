import { Bot } from 'lucide-react';
import Styles from "./Style/TypingIndicator.module.css";

const TypingIndicator = () => {
  return (
    <div className={Styles.container}>
      {/* AI Avatar */}
      <div className={Styles.avatarWrapper}>
        <div className={Styles.avatar}>
          <Bot className={Styles.icon} />
        </div>
      </div>

      {/* Typing Animation */}
      <div className={Styles.bubble}>
        <div className={Styles.dotsContainer}>
          <div className={Styles.dot}></div>
          <div className={Styles.dot}></div>
          <div className={Styles.dot}></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;