import React, { useEffect } from 'react';
import '../Css/FallingBooks.css';

const BOOKS = [
  '📚', '📖', '📕', '📗', '📘', '📙', '📒', '📔', '📓', '📑'
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBookProps() {
  return {
    left: `${getRandomInt(0, 95)}vw`,
    duration: getRandomInt(6, 14),
    fontSize: `${getRandomInt(24, 44)}px`,
    book: BOOKS[getRandomInt(0, BOOKS.length - 1)],
    opacity: Math.random() * 0.5 + 0.5,
  };
}

export default function FallingBooks() {
  useEffect(() => {
    const container = document.querySelector('.dashboard-background');
    if (container) container.innerHTML = '';

    const books = [];
    for (let i = 0; i < 16; i++) {
      const props = randomBookProps();
      const el = document.createElement('div');
      el.className = 'falling-book';
      el.style.left = props.left;
      el.style.animationDuration = `${props.duration}s`;
      el.style.fontSize = props.fontSize;
      el.textContent = props.book;
      el.style.opacity = props.opacity;
      el.style.top = '0px';

      // When animation ends, respawn the book at the top with new props
      el.addEventListener('animationiteration', () => {
        const newProps = randomBookProps();
        el.style.left = newProps.left;
        el.style.animationDuration = `${newProps.duration}s`;
        el.style.fontSize = newProps.fontSize;
        el.textContent = newProps.book;
        el.style.opacity = newProps.opacity;
      });
      books.push(el);
    }
    const bg = document.querySelector('.dashboard-background');
    if (bg) books.forEach(b => bg.appendChild(b));
    return () => {
      if (bg) bg.innerHTML = '';
    };
  }, []);

  return <div className="dashboard-background" />;
}
