import React from 'react'

export interface StepItem {
  id: string
  label: string
  sublabel?: string
}

interface StepperProps {
  steps: StepItem[]
  currentStepIndex: number
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStepIndex }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        padding: '16px 0',
        width: '100%',
      }}
    >
      {/* Background connecting line */}
      <div
        style={{
          position: 'absolute',
          top: '28px',
          left: '20px',
          right: '20px',
          height: '2px',
          backgroundColor: '#E4E4E7',
          zIndex: 1,
        }}
      />

      {steps.map((step, idx) => {
        const isCompleted = idx < currentStepIndex
        const isCurrent = idx === currentStepIndex

        let circleBg = '#FFFFFF'
        let circleBorder = '#E4E4E7'
        let circleColor = '#71717A'

        if (isCompleted) {
          circleBg = '#4F46E5'
          circleBorder = '#4F46E5'
          circleColor = '#FFFFFF'
        } else if (isCurrent) {
          circleBg = '#FFFFFF'
          circleBorder = '#4F46E5'
          circleColor = '#4F46E5'
        }

        return (
          <div
            key={step.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 2,
              flex: 1,
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: circleBg,
                border: `2px solid ${circleBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                color: circleColor,
                transition: 'all 0.2s ease',
              }}
            >
              {isCompleted ? '✓' : idx + 1}
            </div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: isCurrent ? 600 : 500,
                color: isCurrent ? '#4F46E5' : isCompleted ? '#18181B' : '#71717A',
                marginTop: '6px',
                textAlign: 'center',
              }}
            >
              {step.label}
            </span>
            {step.sublabel && (
              <span style={{ fontSize: '10px', color: '#A1A1AA', textAlign: 'center' }}>
                {step.sublabel}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
