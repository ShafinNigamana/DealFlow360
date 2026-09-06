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
        padding: '12px 0',
        width: '100%',
      }}
    >
      {/* Background connecting line */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '30px',
          right: '30px',
          height: '2px',
          backgroundColor: 'var(--neutral-200)',
          zIndex: 1,
        }}
      />

      {steps.map((step, idx) => {
        const isCompleted = idx < currentStepIndex
        const isCurrent = idx === currentStepIndex

        let circleBg = '#FFFFFF'
        let circleBorder = 'var(--neutral-200)'
        let circleColor = 'var(--text-muted)'

        if (isCompleted) {
          circleBg = 'var(--status-approved)'
          circleBorder = 'var(--status-approved)'
          circleColor = '#FFFFFF'
        } else if (isCurrent) {
          circleBg = 'var(--status-pending-subtle)'
          circleBorder = 'var(--copper-500)'
          circleColor = 'var(--copper-700)'
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
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: circleBg,
                border: `2px solid ${circleBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                color: circleColor,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {isCompleted ? '✓' : idx + 1}
            </div>

            <div style={{ marginTop: '8px', textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: isCurrent ? 700 : 600,
                  color: isCurrent ? 'var(--ink-900)' : isCompleted ? 'var(--status-approved)' : 'var(--text-secondary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {step.label}
              </div>
              {step.sublabel && (
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {step.sublabel}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
