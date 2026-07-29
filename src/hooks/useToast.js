import { useCallback, useEffect, useRef, useState } from 'react';

export default function useToast(initialMessage = '') {
  const [message, setMessage] = useState(initialMessage);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const showToast = useCallback((nextMessage, duration = 2200) => {
    setMessage(nextMessage);
    setVisible(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setVisible(false), duration);
  }, []);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return { message, visible, showToast };
}
