/**
 * @fileoverview Onboarding Tour Component
 * @description Interactive product tour for new users
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { tourSteps } from './tour-config';
import { useAuth } from '@/components/contexts/AuthContext';
import { createPageUrl } from '@/utils';

export function OnboardingTour({ onComplete, onSkip }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetElement, setTargetElement] = useState(null);

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!step) return;

    if (step.target) {
      const element = document.querySelector(step.target);
      setTargetElement(element);

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetElement(null);
    }
  }, [currentStep, step]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleComplete();
      return;
    }

    const nextStep = tourSteps[currentStep + 1];
    if (nextStep.page && !location.pathname.includes(nextStep.page)) {
      navigate(createPageUrl(nextStep.page));
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    } else {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, isLastStep, location, navigate]);

  const handlePrevious = useCallback(() => {
    if (isFirstStep) return;
    setCurrentStep(currentStep - 1);
  }, [currentStep, isFirstStep]);

  const handleSkip = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onSkip?.(), 300);
  }, [onSkip]);

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onComplete?.(), 300);
  }, [onComplete]);

  const getStepPosition = () => {
    if (!targetElement || !step.target) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const rect = targetElement.getBoundingClientRect();
    const placement = step.placement || 'bottom';

    const positions = {
      top: { top: rect.top - 20, left: rect.left + rect.width / 2, transform: 'translate(-50%, -100%)' },
      bottom: { top: rect.bottom + 20, left: rect.left + rect.width / 2, transform: 'translate(-50%, 0)' },
      left: { top: rect.top + rect.height / 2, left: rect.left - 20, transform: 'translate(-100%, -50%)' },
      right: { top: rect.top + rect.height / 2, left: rect.right + 20, transform: 'translate(0, -50%)' },
      center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    };

    return positions[placement];
  };

  if (!isVisible) return null;

  return (
    <>
      <AnimatePresence>
        {step.highlight && targetElement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none"
          >
            <div className="absolute inset-0 bg-black/60" />
            <div
              className="absolute border-4 border-blue-500 rounded-lg pointer-events-none"
              style={{
                top: targetElement.getBoundingClientRect().top - 4,
                left: targetElement.getBoundingClientRect().left - 4,
                width: targetElement.getBoundingClientRect().width + 8,
                height: targetElement.getBoundingClientRect().height + 8,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-[101]"
        style={getStepPosition()}
      >
        <Card className="bg-slate-900 border-blue-500/30 shadow-2xl max-w-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-300">{step.content}</p>
              </div>
              {step.showSkip !== false && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSkip}
                  className="text-slate-400 hover:text-white -mt-2 -mr-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {tourSteps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentStep
                        ? 'w-6 bg-blue-500'
                        : idx < currentStep
                        ? 'w-1.5 bg-blue-500/50'
                        : 'w-1.5 bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    className="border-slate-700"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLastStep ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Finish
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}