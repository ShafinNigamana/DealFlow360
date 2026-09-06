'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Concept1Icon,
  Concept1Lockup,
  Concept2Icon,
  Concept2Lockup,
  Concept3Icon,
  Concept3Lockup,
  Concept4Icon,
  Concept4Lockup,
} from '@/components/brand/LogoConcepts'

export default function BrandShowcasePage() {
  const [darkTheme, setDarkTheme] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'c1' | 'c2' | 'c3' | 'c4'>('all')

  const concepts = [
    {
      id: 'c1',
      num: 1,
      name: 'The Quadrant Möbius',
      tagline: 'Continuous Planar Loop',
      desc: 'A single continuous folded geometric band with 4 progressive facets (Quotation → Approval → Fulfillment → Billing) circling a central 45° diamond negative-space aperture. Zero curves, zero decorative fluff.',
      badge: 'Recommended',
      Icon: Concept1Icon,
      Lockup: Concept1Lockup,
      features: [
        'Unbroken 4-stage flow',
        '45° diamond negative space',
        'Fintech / B2B SaaS authority',
        'Razor-sharp 16px silhouette',
      ],
    },
    {
      id: 'c2',
      num: 2,
      name: 'The Quadrant Shutter',
      tagline: 'Interlocking Precision Blades',
      desc: 'Four interlocking geometric blades rotating orthogonally to frame an optical pinhole aperture. Represents raw deals getting calibrated and focused down into captured revenue.',
      badge: 'Mechanical Precision',
      Icon: Concept2Icon,
      Lockup: Concept2Lockup,
      features: [
        'Camera aperture physics',
        '100% lettermark-free',
        'Subtle focal core dot',
        'High contrast on dark & light',
      ],
    },
    {
      id: 'c3',
      num: 3,
      name: 'The Vector Orbit 360',
      tagline: 'Precision Schematic Circuit',
      desc: 'Engineered in the spirit of modern developer tools (Linear, Stripe). A calibrated monoline circuit linking 4 milestone coordinate gates and returning re-entrant into the central bullseye.',
      badge: 'Dev-Tool & Fintech',
      Icon: Concept3Icon,
      Lockup: Concept3Lockup,
      features: [
        'Milestone waypoint nodes',
        'Re-entrant closed 360 trajectory',
        'Monospace typography pairing',
        'High technical credibility',
      ],
    },
    {
      id: 'c4',
      num: 4,
      name: 'The Interlocking Facets',
      tagline: 'Hexagonal 4-Pillar Prism',
      desc: 'Four monolithic polygonal planes in isometric alignment with an inner negative-space diamond cut. Symbolizes institutional stability across Sales, Governance, Operations, and Finance.',
      badge: 'Institutional Stability',
      Icon: Concept4Icon,
      Lockup: Concept4Lockup,
      features: [
        'Isometric polygon balance',
        'Institutional grounding',
        'Stands out in monochrome print',
        'Strong corporate presence',
      ],
    },
  ]

  const filteredConcepts = activeTab === 'all' 
    ? concepts 
    : concepts.filter((c) => c.id === activeTab)

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: darkTheme ? '#0B0F19' : '#F8FAFC',
        color: darkTheme ? '#F1F5F9' : '#0F172A',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        transition: 'background-color 0.2s ease, color 0.2s ease',
      }}
    >
      {/* Top Bar */}
      <header
        style={{
          borderBottom: `1px solid ${darkTheme ? '#1E293B' : '#E2E8F0'}`,
          backgroundColor: darkTheme ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '16px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              href="/admin/deals"
              style={{
                fontSize: '13px',
                color: '#6366F1',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              ← Back to App
            </Link>
            <span style={{ color: darkTheme ? '#475569' : '#CBD5E1' }}>|</span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: darkTheme ? '#94A3B8' : '#64748B',
              }}
            >
              DealFlow360 • Brand Identity Suite
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setDarkTheme(!darkTheme)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${darkTheme ? '#334155' : '#CBD5E1'}`,
                backgroundColor: darkTheme ? '#1E293B' : '#FFFFFF',
                color: darkTheme ? '#F8FAFC' : '#0F172A',
              }}
            >
              <span>{darkTheme ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Hero Header */}
        <div style={{ marginBottom: '36px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              border: '1px solid rgba(79, 70, 229, 0.3)',
              color: '#6366F1',
              fontSize: '11.5px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            Zero-Lettermark • 100% Vector Geometry • Negative Space
          </div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: '8px',
            }}
          >
            Brand Identity Concepts
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: darkTheme ? '#94A3B8' : '#64748B',
              maxWidth: '720px',
              lineHeight: 1.55,
            }}
          >
            No generic gradient blobs, no common letter &quot;D&quot; initials, and no decorative fluff.
            Every mark is engineered strictly from the 4 sales operations stages (Quotation → Approval → Fulfillment → Billing) and scales from 16px favicon to desktop headers.
          </p>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '32px',
            borderBottom: `1px solid ${darkTheme ? '#1E293B' : '#E2E8F0'}`,
            paddingBottom: '12px',
          }}
        >
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: activeTab === 'all' ? 700 : 500,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'all' ? '#4F46E5' : 'transparent',
              color: activeTab === 'all' ? '#FFFFFF' : darkTheme ? '#94A3B8' : '#64748B',
            }}
          >
            All 4 Concepts
          </button>
          {concepts.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveTab(c.id as any)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: activeTab === c.id ? 700 : 500,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeTab === c.id ? '#4F46E5' : 'transparent',
                color: activeTab === c.id ? '#FFFFFF' : darkTheme ? '#94A3B8' : '#64748B',
              }}
            >
              Concept {c.num}: {c.name}
            </button>
          ))}
        </div>

        {/* Concepts Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {filteredConcepts.map((concept) => {
            const { Icon, Lockup } = concept
            const isRec = concept.id === 'c1'

            return (
              <div
                key={concept.id}
                id={concept.id}
                style={{
                  backgroundColor: darkTheme ? '#111827' : '#FFFFFF',
                  borderRadius: '16px',
                  border: `1px solid ${isRec ? '#6366F1' : darkTheme ? '#1F2937' : '#E2E8F0'}`,
                  boxShadow: isRec
                    ? '0 0 0 2px rgba(99, 102, 241, 0.2), 0 10px 25px rgba(0,0,0,0.06)'
                    : '0 4px 12px rgba(0,0,0,0.04)',
                  padding: '32px',
                  position: 'relative',
                }}
              >
                {/* Header of Concept */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginBottom: '28px',
                    borderBottom: `1px solid ${darkTheme ? '#1F2937' : '#F1F5F9'}`,
                    paddingBottom: '20px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2
                        style={{
                          fontSize: '22px',
                          fontWeight: 800,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        Concept {concept.num}: {concept.name}
                      </h2>
                      <span
                        style={{
                          backgroundColor: isRec ? '#4F46E5' : darkTheme ? '#1E293B' : '#EEF2FF',
                          color: isRec ? '#FFFFFF' : '#4F46E5',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: '6px',
                          letterSpacing: '0.03em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {concept.badge}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#6366F1',
                        fontWeight: 600,
                        marginTop: '2px',
                      }}
                    >
                      {concept.tagline}
                    </div>
                    <p
                      style={{
                        fontSize: '14px',
                        color: darkTheme ? '#94A3B8' : '#64748B',
                        marginTop: '8px',
                        maxWidth: '780px',
                        lineHeight: 1.5,
                      }}
                    >
                      {concept.desc}
                    </p>
                  </div>
                </div>

                {/* 3-Tier Size Previews Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '24px',
                    marginBottom: '28px',
                  }}
                >
                  {/* Tier 1: Full Horizontal Lockup */}
                  <div
                    style={{
                      backgroundColor: darkTheme ? '#0F172A' : '#F8FAFC',
                      borderRadius: '12px',
                      border: `1px solid ${darkTheme ? '#1E293B' : '#E2E8F0'}`,
                      padding: '24px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: darkTheme ? '#64748B' : '#94A3B8',
                        marginBottom: '16px',
                      }}
                    >
                      1. Primary Wordmark Lockup (40px)
                    </div>
                    <div
                      style={{
                        minHeight: '70px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: darkTheme ? '#090D16' : '#FFFFFF',
                        borderRadius: '8px',
                        border: `1px solid ${darkTheme ? '#1E293B' : '#E2E8F0'}`,
                        padding: '16px',
                      }}
                    >
                      <Lockup size={38} dark={darkTheme} />
                    </div>
                  </div>

                  {/* Tier 2: Real SaaS Navigation Bar Mockup (32px) */}
                  <div
                    style={{
                      backgroundColor: darkTheme ? '#0F172A' : '#F8FAFC',
                      borderRadius: '12px',
                      border: `1px solid ${darkTheme ? '#1E293B' : '#E2E8F0'}`,
                      padding: '24px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: darkTheme ? '#64748B' : '#94A3B8',
                        marginBottom: '16px',
                      }}
                    >
                      2. Console Nav-Bar Context (~32px)
                    </div>
                    <div
                      style={{
                        minHeight: '70px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: darkTheme ? '#090D16' : '#FFFFFF',
                        borderRadius: '8px',
                        border: `1px solid ${darkTheme ? '#1E293B' : '#E2E8F0'}`,
                        padding: '10px 18px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Icon size={26} dark={darkTheme} />
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            color: darkTheme ? '#F8FAFC' : '#0F172A',
                          }}
                        >
                          DealFlow360
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: darkTheme ? '#1E293B' : '#F1F5F9',
                            color: darkTheme ? '#94A3B8' : '#64748B',
                          }}
                        >
                          Pipeline
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#4F46E5',
                            color: '#FFFFFF',
                            fontWeight: 600,
                          }}
                        >
                          New Quote
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tier 3: Browser Tab Favicon Mockup (16px) */}
                  <div
                    style={{
                      backgroundColor: darkTheme ? '#0F172A' : '#F8FAFC',
                      borderRadius: '12px',
                      border: `1px solid ${darkTheme ? '#1E293B' : '#E2E8F0'}`,
                      padding: '24px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: darkTheme ? '#64748B' : '#94A3B8',
                        marginBottom: '16px',
                      }}
                    >
                      3. Browser Tab Favicon (16px)
                    </div>
                    <div
                      style={{
                        minHeight: '70px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: darkTheme ? '#090D16' : '#E2E8F0',
                        borderRadius: '8px',
                        border: `1px solid ${darkTheme ? '#1E293B' : '#CBD5E1'}`,
                        padding: '12px',
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: darkTheme ? '#1E293B' : '#FFFFFF',
                          padding: '6px 14px',
                          borderRadius: '6px 6px 0 0',
                          borderBottom: '2px solid #4F46E5',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        }}
                      >
                        <Icon size={16} dark={darkTheme} />
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: darkTheme ? '#F8FAFC' : '#0F172A',
                          }}
                        >
                          DealFlow360 • Dashboard
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Architectural Qualities */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    backgroundColor: darkTheme ? '#0A0E1A' : '#F8FAFC',
                    borderRadius: '8px',
                    padding: '14px 18px',
                    border: `1px solid ${darkTheme ? '#1E293B' : '#E2E8F0'}`,
                  }}
                >
                  {concept.features.map((feat, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12.5px',
                        color: darkTheme ? '#CBD5E1' : '#334155',
                      }}
                    >
                      <span style={{ color: '#4F46E5', fontWeight: 800 }}>✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
