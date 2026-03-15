import { useState } from "react";
import OnboardingLayout from "../components/OnboardingLayout";
import OptionList from "../components/OptionList";

const OPTIONS = ["Man", "Woman", "Nonbinary"];

export default function GenderScreen({ initialValue = null, onNext, onBack, onUpdate }) {
  const [selected, setSelected] = useState(initialValue);

  function handleSelect(value) {
    setSelected(value);
    onUpdate?.({ gender: value });
  }

  return (
    <OnboardingLayout
      step={2}
      totalSteps={5}
      title="How do you identify?"
      canContinue={selected !== null}
      onBack={onBack}
      onNext={() => onNext({ gender: selected })}
    >
      <OptionList
        options={OPTIONS}
        selected={selected}
        onSelect={handleSelect}
      />
    </OnboardingLayout>
  );
}
