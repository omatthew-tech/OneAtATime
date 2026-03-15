import { useState } from "react";
import OnboardingLayout from "../components/OnboardingLayout";
import OptionList from "../components/OptionList";

const OPTIONS = ["Introvert", "Omnivert", "Extrovert"];

export default function IntroversionScreen({ initialValue = "Introvert", onNext, onBack, onUpdate }) {
  const [selected, setSelected] = useState(initialValue);

  function handleSelect(value) {
    setSelected(value);
    onUpdate?.({ introversion: value });
  }

  return (
    <OnboardingLayout
      step={1}
      totalSteps={5}
      title="How introverted are you?"
      canContinue={selected !== null}
      onBack={onBack}
      onNext={() => onNext({ introversion: selected })}
    >
      <OptionList
        options={OPTIONS}
        selected={selected}
        onSelect={handleSelect}
      />
    </OnboardingLayout>
  );
}
