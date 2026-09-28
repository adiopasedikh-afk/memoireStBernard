'use client';

import React, { useState, useEffect } from 'react';

export interface CarouselSlide {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

interface CarouselDisplayProps {
  slides?: CarouselSlide[];
}

export default function CarouselDisplay({ slides = [] }: CarouselDisplayProps) {
  const activeSlides = slides.filter((slide) => slide.is_active !== false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSlides.length]);

  if (activeSlides.length === 0) {
    return null;
  }

  const currentSlide = activeSlides[currentIndex];

  return (
    <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-2xl bg-slate-900 shadow-2xl my-6">
      {/* Image de fond avec transition */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out"
        style={{ backgroundImage: `url(${currentSlide.image_url})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      {/* Légende du slide */}
      {(currentSlide.title || currentSlide.description) && (
        <div className="absolute bottom-10 left-6 right-6 md:left-12 md:right-12 text-white space-y-2">
          {currentSlide.title && (
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight drop-shadow-md">
              {currentSlide.title}
            </h2>
          )}
          {currentSlide.description && (
            <p className="text-sm md:text-base text-slate-200 max-w-2xl drop-shadow">
              {currentSlide.description}
            </p>
          )}
        </div>
      )}

      {/* Puces de navigation */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${index === currentIndex ? 'w-8 bg-amber-500' : 'w-2.5 bg-white/50 hover:bg-white'
                }`}
              aria-label={`Diapositive ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}