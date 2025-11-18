import { useEffect, useRef } from 'react';

/**
 * Custom hook that automatically scrolls to the bottom of the page
 * on component mount and whenever new content is added to the DOM
 */
const useAutoScrollToBottom = (dependencies = []) => {
  const observerRef = useRef(null);
  const isAutoScrollingRef = useRef(false);

  const scrollToBottom = () => {
    if (isAutoScrollingRef.current) return;
    
    isAutoScrollingRef.current = true;
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
    
    // Reset flag after scroll animation completes
    setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 1000);
  };

  useEffect(() => {
    // Initial scroll to bottom on mount
    scrollToBottom();

    // Create MutationObserver to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      let shouldScroll = false;
      
      mutations.forEach((mutation) => {
        // Check if nodes were added
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Only scroll if actual content was added (not just text nodes)
          const hasContentNodes = Array.from(mutation.addedNodes).some(
            node => node.nodeType === Node.ELEMENT_NODE
          );
          if (hasContentNodes) {
            shouldScroll = true;
          }
        }
        
        // Check if attributes changed (like class changes that might affect layout)
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || 
             mutation.attributeName === 'style')) {
          shouldScroll = true;
        }
      });

      if (shouldScroll) {
        // Small delay to ensure DOM has finished updating
        setTimeout(scrollToBottom, 100);
      }
    });

    // Start observing the document body for changes
    const targetNode = document.body;
    const config = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    };

    observer.observe(targetNode, config);
    observerRef.current = observer;

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []); // Empty dependency array for initial setup

  // Effect for external dependencies (like new data)
  useEffect(() => {
    if (dependencies.length > 0) {
      scrollToBottom();
    }
  }, [dependencies]);

  // Return scroll function in case manual scroll is needed
  return { scrollToBottom };
};

export default useAutoScrollToBottom;