// app/animations.ts
'use client';

import { useEffect } from 'react';

// 뷰포트에 요소가 나타날 때 애니메이션 트리거
export function useIntersectionObserver(): void {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    // 페이드인 애니메이션 요소 관찰
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((el) => {
      observer.observe(el);
    });

    // 순차적 애니메이션 요소 관찰
    const staggerElements = document.querySelectorAll('.stagger-item');
    staggerElements.forEach((el, index) => {
      (el as HTMLElement).style.transitionDelay = `${index * 0.1}s`;
      (el as HTMLElement).style.transitionProperty = 'opacity, transform';
      (el as HTMLElement).style.transitionDuration = '0.6s';
      (el as HTMLElement).style.transitionTimingFunction = 'ease';
      observer.observe(el);
    });

    return () => {
      fadeElements.forEach((el) => {
        observer.unobserve(el);
      });
      staggerElements.forEach((el) => {
        observer.unobserve(el);
      });
    };
  }, []);
}

// 타이핑 효과
export function useTypingEffect(elementId: string, text: string, delay: number = 100): void {
  useEffect(() => {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.textContent = '';
    
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(timer);
      }
    }, delay);

    return () => {
      clearInterval(timer);
    };
  }, [elementId, text, delay]);
}

// 카운트업 효과
export function useCountUp(elementId: string, endValue: number, duration: number = 2000): void {
  useEffect(() => {
    const element = document.getElementById(elementId);
    if (!element) return;

    let startTimestamp: number | null = null;
    const startValue = 0;
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentValue = Math.floor(progress * (endValue - startValue) + startValue);
      
      element.textContent = currentValue.toString();
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = endValue.toString();
      }
    };
    
    window.requestAnimationFrame(step);
  }, [elementId, endValue, duration]);
}