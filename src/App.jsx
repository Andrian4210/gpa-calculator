import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx'
import { Calculator, GraduationCap, BookOpen, Target, Sparkles, Calendar, Save, FileText, Trophy, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react'
import '../App.css'

const SUBJECTS = {
  'Visual Art': 0.3,
  'Media': 0.3,
  'Drama': 0.3,
  'Music': 0.3,
  'Spanish': 0.6,
  'Japanese': 0.6,
  'HPE': 0.6,
  'Digital': 0.3,
  'Design': 0.3,
  'Math': 1.0,
  'Science': 1.0,
  'English': 1.0,
  'Humanities': 1.0
}

const GRADES = {
  'A+': 15, 'A': 14, 'A-': 13,
  'B+': 12, 'B': 11, 'B-': 10,
  'C+': 9, 'C': 8, 'C-': 7,
  'D+': 6, 'D': 5, 'D-': 4,
  'F+': 3, 'F': 2, 'F-': 1
}

const GRADE_OPTIONS = Object.keys(GRADES)
const MAX_SUBJECTS = 8
const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Term 4']
const FINAL_TERMS = new Set(['Term 2', 'Term 4'])
// Semester subjects (0.3 weight) - only have Term 1-2 OR Term 3-4
const SEMESTER_SUBJECTS = new Set([
  'Visual Art',
  'Media',
  'Drama',
  'Music',
  'Digital',
  'Design'
])
// Three-term subjects (0.6 weight) - have Term 1, 2, 3 (no Term 4)
const THREE_TERM_SUBJECTS = new Set([
  'Spanish',
  'Japanese',
  'HPE'
])
const GOOGLE_DOC_ID = '1ICuIvuBC-uTpdKCgQWYNKqAfPfnOzOQPIyLYMoXhqvo'
const GOOGLE_APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbyjgbJvf_vTYx3WzoKqL0Tah8QsHYiPvaL3WPlThWpQAFMB9z0nvDKbqT2RigFMaYyI/exec'

function App() {
  const [currentStep, setCurrentStep] = useState('selection')
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [currentTerm, setCurrentTerm] = useState(TERMS[0])
  const [gradeEntryModes, setGradeEntryModes] = useState({}) // { subject: 'terms' | 'final' }
  const [termGrades, setTermGrades] = useState({}) // { subject: { 'Term 1': 'A', 'Term 2': 'B+', ... } }
  const [directFinalGrades, setDirectFinalGrades] = useState({}) // { subject: 'A+' }
  const [termFinalGrades, setTermFinalGrades] = useState({}) // { subject: 'A+' }
  const [finalGrades, setFinalGrades] = useState({}) // Calculated final grades for each subject
  const [gpa, setGpa] = useState(null)
  const [yearlyGPA, setYearlyGPA] = useState(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveAttempts, setSaveAttempts] = useState(0)
  const [userDismissedDialog, setUserDismissedDialog] = useState(false)

  const handleSubjectToggle = (subject, checked) => {
    if (checked) {
      if (selectedSubjects.length < MAX_SUBJECTS) {
        setSelectedSubjects([...selectedSubjects, subject])
        // Default to terms mode for new subjects
        setGradeEntryModes(prev => ({ ...prev, [subject]: 'terms' }))
      } else {
        alert(`You can select a maximum of ${MAX_SUBJECTS} subjects.`)
      }
    } else {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject))
      const newTermGrades = { ...termGrades }
      delete newTermGrades[subject]
      setTermGrades(newTermGrades)
      const newDirectFinalGrades = { ...directFinalGrades }
      delete newDirectFinalGrades[subject]
      setDirectFinalGrades(newDirectFinalGrades)
      const newFinalGrades = { ...finalGrades }
      delete newFinalGrades[subject]
      setFinalGrades(newFinalGrades)
      const newTermFinalGrades = { ...termFinalGrades }
      delete newTermFinalGrades[subject]
      setTermFinalGrades(newTermFinalGrades)
      const newGradeEntryModes = { ...gradeEntryModes }
      delete newGradeEntryModes[subject]
      setGradeEntryModes(newGradeEntryModes)
    }
  }

  const handleGradeEntryModeToggle = (subject) => {
    const currentMode = gradeEntryModes[subject] || 'terms'
    const newMode = currentMode === 'terms' ? 'final' : 'terms'
    
    setGradeEntryModes(prev => ({
      ...prev,
      [subject]: newMode
    }))

    // Clear existing grades when switching modes
    if (newMode === 'final') {
      const newTermGrades = { ...termGrades }
      delete newTermGrades[subject]
      setTermGrades(newTermGrades)
      const newTermFinalGrades = { ...termFinalGrades }
      delete newTermFinalGrades[subject]
      setTermFinalGrades(newTermFinalGrades)
    } else {
      const newDirectFinalGrades = { ...directFinalGrades }
      delete newDirectFinalGrades[subject]
      setDirectFinalGrades(newDirectFinalGrades)
    }
  }

  const handleGlobalModeToggle = () => {
    // Check if all subjects are currently in final mode
    const allInFinalMode = selectedSubjects.every(subject => 
      gradeEntryModes[subject] === 'final'
    )
    
    // Toggle all subjects to the opposite mode
    const newMode = allInFinalMode ? 'terms' : 'final'
    const newGradeEntryModes = {}
    
    selectedSubjects.forEach(subject => {
      newGradeEntryModes[subject] = newMode
    })
    
    setGradeEntryModes(newGradeEntryModes)
    
    // Clear all grades when switching modes globally
    if (newMode === 'final') {
      setTermGrades({})
      setTermFinalGrades({})
    } else {
      setDirectFinalGrades({})
      setTermFinalGrades({})
    }
  }

  const getGlobalModeStatus = () => {
    if (selectedSubjects.length === 0) return 'mixed'
    
    const finalModeCount = selectedSubjects.filter(subject => 
      gradeEntryModes[subject] === 'final'
    ).length
    
    if (finalModeCount === 0) return 'terms'
    if (finalModeCount === selectedSubjects.length) return 'final'
    return 'mixed'
  }

  const isSemesterSubject = (subject) => SEMESTER_SUBJECTS.has(subject)
  const isThreeTermSubject = (subject) => THREE_TERM_SUBJECTS.has(subject)

  const getTermsForSubject = (subject) => {
    const currentTermIndex = TERMS.indexOf(currentTerm)
    if (currentTermIndex === -1) return TERMS

    // Three-term subjects: only Term 1, 2, 3
    if (isThreeTermSubject(subject)) {
      if (currentTerm === 'Term 1') return ['Term 1']
      if (currentTerm === 'Term 2') return ['Term 1', 'Term 2']
      if (currentTerm === 'Term 3') return ['Term 1', 'Term 2', 'Term 3']
      return ['Term 1', 'Term 2', 'Term 3'] // Term 4 still shows Term 1-3
    }

    // Semester subjects: Term 1-2 OR Term 3-4
    if (isSemesterSubject(subject)) {
      if (currentTerm === 'Term 1') return ['Term 1']
      if (currentTerm === 'Term 2') return ['Term 1', 'Term 2']
      if (currentTerm === 'Term 3') return ['Term 3']
      return ['Term 3', 'Term 4']
    }

    // Full-year subjects: all terms up to current
    return TERMS.slice(0, currentTermIndex + 1)
  }

  const canCaptureSemesterFinal = (subject) => {
    if (isSemesterSubject(subject)) {
      return FINAL_TERMS.has(currentTerm)
    }
    if (isThreeTermSubject(subject)) {
      return currentTerm === 'Term 3' // Final grade captured at Term 3
    }
    return false
  }

  const handleTermGradeChange = (subject, term, grade) => {
    setTermGrades(prev => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        [term]: grade
      }
    }))
  }

  const handleDirectFinalGradeChange = (subject, grade) => {
    setDirectFinalGrades(prev => ({
      ...prev,
      [subject]: grade
    }))
  }

  const handleTermFinalGradeChange = (subject, grade) => {
    setTermFinalGrades(prev => ({
      ...prev,
      [subject]: grade
    }))
  }

  const calculateSubjectFinalGrade = (subject) => {
    const mode = gradeEntryModes[subject] || 'terms'
    
    if (mode === 'final') {
      const directGrade = directFinalGrades[subject]
      if (!directGrade) return null
      return { grade: directGrade, points: GRADES[directGrade] }
    } else {
      // Terms mode
      const overrideGrade = termFinalGrades[subject]
      if (overrideGrade && GRADES[overrideGrade]) {
        return { grade: overrideGrade, points: GRADES[overrideGrade] }
      }

      const subjectTerms = termGrades[subject]
      const relevantTerms = getTermsForSubject(subject)
      if (!subjectTerms || relevantTerms.length === 0) return null

      const enteredGrades = relevantTerms
        .map(term => subjectTerms[term])
        .filter(grade => grade && grade !== '')
      if (enteredGrades.length === 0) return null

      // Calculate average of entered term grades
      const totalPoints = enteredGrades.reduce((sum, grade) => sum + GRADES[grade], 0)
      const averagePoints = totalPoints / enteredGrades.length

      // Find the closest grade to the average
      let closestGrade = 'F-'
      let closestDiff = Math.abs(GRADES['F-'] - averagePoints)
      
      Object.entries(GRADES).forEach(([grade, value]) => {
        const diff = Math.abs(value - averagePoints)
        if (diff < closestDiff) {
          closestGrade = grade
          closestDiff = diff
        }
      })

      return { grade: closestGrade, points: averagePoints }
    }
  }

  const calculateGPA = () => {
    let totalWeightedScore = 0
    let totalKnownWeight = 0

    selectedSubjects.forEach(subject => {
      const weight = SUBJECTS[subject]
      const finalGrade = finalGrades[subject]
      
      if (finalGrade && finalGrade.points) {
        totalWeightedScore += finalGrade.points * weight
        totalKnownWeight += weight
      }
    })

    return totalKnownWeight > 0 ? totalWeightedScore / totalKnownWeight : 0
  }

  const calculateYearlyGPA = () => {
    // Calculate yearly GPA using the same logic as current GPA
    // This represents the final yearly GPA based on final calculated grades
    return calculateGPA()
  }

  const calculateRequiredGrades = (targetGPA) => {
    let currentWeightedScore = 0
    let remainingWeight = 0
    const missingSubjects = []
    let totalKnownWeight = 0

    selectedSubjects.forEach(subject => {
      const weight = SUBJECTS[subject]
      const finalGrade = finalGrades[subject]
      
      if (finalGrade && finalGrade.points) {
        currentWeightedScore += finalGrade.points * weight
        totalKnownWeight += weight
      } else {
        remainingWeight += weight
        missingSubjects.push(subject)
      }
    })

    if (missingSubjects.length === 0) {
      const currentGPA = totalKnownWeight > 0 ? currentWeightedScore / totalKnownWeight : 0;
      return { possible: currentGPA >= targetGPA, grades: {} };
    }

    const targetTotalScore = targetGPA * 5.8;
    const requiredScoreFromMissing = targetTotalScore - currentWeightedScore;
    const averageRequiredGrade = requiredScoreFromMissing / remainingWeight;
    
    if (averageRequiredGrade > 15) {
      return { possible: false, grades: {} }
    }

    const requiredGrades = {}
    missingSubjects.forEach(subject => {
      const requiredGradeValue = Math.max(1, Math.min(15, averageRequiredGrade))
      
      let closestGrade = 'F-'
      let closestDiff = Math.abs(GRADES['F-'] - requiredGradeValue)
      
      Object.entries(GRADES).forEach(([grade, value]) => {
        const diff = Math.abs(value - requiredGradeValue)
        if (diff < closestDiff) {
          closestGrade = grade
          closestDiff = diff
        }
      })
      
      requiredGrades[subject] = closestGrade
    })

    return { possible: true, grades: requiredGrades }
  }

  const saveToGoogleDoc = async () => {
    if (!studentName.trim()) {
      alert('Please enter your name before saving!')
      return
    }

    if (!GOOGLE_APPS_SCRIPT_URL) {
      alert('Google Apps Script URL is not configured. Please set VITE_GOOGLE_APPS_SCRIPT_URL in your environment.')
      return
    }

    setIsSaving(true)
    
    // Open the Google Doc first, before the async operation
    // This ensures it's triggered by user action and won't be blocked by popup blockers
    const docUrl = `https://docs.google.com/document/d/${GOOGLE_DOC_ID}/edit`
    const docWindow = window.open(docUrl, '_blank', 'noopener,noreferrer')
    
    try {
      const subjectSummaries = selectedSubjects.map(subject => ({
        subject,
        weight: SUBJECTS[subject],
        entryMode: gradeEntryModes[subject] || 'terms',
        finalGrade: finalGrades[subject]?.grade ?? null,
        finalPoints: finalGrades[subject]?.points ?? null,
        termGrades: termGrades[subject] ?? {},
        directFinalGrade: directFinalGrades[subject] ?? null,
        semesterFinalGrade: termFinalGrades[subject] ?? null
      }))

      const payload = {
        studentName: studentName.trim(),
        currentTerm,
        gpa: gpa !== null ? Number(gpa.toFixed(2)) : null,
        yearlyGpa: yearlyGPA !== null ? Number(yearlyGPA.toFixed(2)) : null,
        subjects: subjectSummaries,
        timestamp: new Date().toISOString(),
        googleDocId: GOOGLE_DOC_ID
      }

      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          data: JSON.stringify(payload)
        })
      })

      // Try to read the response
      let responseData
      try {
        responseData = await response.json()
      } catch (e) {
        // If JSON parsing fails, assume success (for no-cors compatibility)
        responseData = { success: true }
      }

      if (responseData.success !== false) {
        alert(`Successfully saved ${studentName}'s GPA (${gpa?.toFixed(2)}) to Google Doc!`)
        
        // Check if popup was blocked
        if (!docWindow || docWindow.closed || typeof docWindow.closed === 'undefined') {
          // Popup was blocked, provide a fallback
          const openNow = confirm('The Google Doc popup was blocked. Click OK to open it now.')
          if (openNow) {
            window.open(docUrl, '_blank', 'noopener,noreferrer')
          }
        }
        
        setShowSaveDialog(false)
        setStudentName('')
        setSaveAttempts(0)
      } else {
        throw new Error(responseData.message || 'Failed to save to Google Doc')
      }
    } catch (error) {
      console.error('Failed to save GPA to Google Doc:', error)
      alert(`Failed to save to Google Doc. ${error.message ?? ''}`.trim())
      // Close the doc window if save failed
      if (docWindow && !docWindow.closed) {
        docWindow.close()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDialogClose = () => {
    setSaveAttempts(prev => prev + 1)
    setShowSaveDialog(false)
    setUserDismissedDialog(true)
  }

  const getPassiveAggressiveMessage = () => {
    switch (saveAttempts) {
      case 0:
        return "Save your GPA to Google Doc? It would be a shame if all this hard work just... disappeared."
      case 1:
        return "Are you sure you don't want to save? Your future self might thank you for keeping records..."
      case 2:
        return "Really? Still not saving? I mean, it's only your academic progress we're talking about here."
      case 3:
        return "Fine, I guess some people just like living dangerously without backups. Your choice! 🤷‍♂️"
      default:
        return "Okay, I'll stop asking. But don't come crying to me when you need these numbers later!"
    }
  }

  // Update final grades when term grades or direct final grades change
  useEffect(() => {
    const newFinalGrades = {}
    selectedSubjects.forEach(subject => {
      const finalGrade = calculateSubjectFinalGrade(subject)
      if (finalGrade) {
        newFinalGrades[subject] = finalGrade
      }
    })
    setFinalGrades(newFinalGrades)
  }, [termGrades, directFinalGrades, gradeEntryModes, selectedSubjects, termFinalGrades, currentTerm])

  // Update GPA when final grades change
  useEffect(() => {
    if (selectedSubjects.length > 0) {
      const currentGPA = calculateGPA()
      setGpa(currentGPA)
      setYearlyGPA(calculateYearlyGPA())
    }
  }, [finalGrades, selectedSubjects])

  // Show save dialog when GPA is calculated and all subjects have grades
  useEffect(() => {
    if (yearlyGPA && yearlyGPA > 0 && selectedSubjects.length > 0 && !userDismissedDialog) {
      const allSubjectsHaveGrades = selectedSubjects.every(subject => finalGrades[subject])
      if (allSubjectsHaveGrades && saveAttempts < 5) {
        setTimeout(() => setShowSaveDialog(true), 1000)
      }
    }
  }, [yearlyGPA, finalGrades, selectedSubjects, saveAttempts, userDismissedDialog])

  const proceedToGradeEntry = () => {
    if (selectedSubjects.length > 0) {
      setCurrentStep('gradeEntry')
    }
  }

  const resetCalculator = () => {
    setCurrentStep('selection')
    setSelectedSubjects([])
    setCurrentTerm(TERMS[0])
    setGradeEntryModes({})
    setTermGrades({})
    setDirectFinalGrades({})
    setTermFinalGrades({})
    setFinalGrades({})
    setGpa(null)
    setYearlyGPA(null)
    setSaveAttempts(0)
  }

  const getSubjectTermsCompleted = (subject) => {
    const subjectTerms = termGrades[subject] || {}
    const relevantTerms = getTermsForSubject(subject)
    if (relevantTerms.length === 0) return 0
    return relevantTerms.filter(term => subjectTerms[term] && subjectTerms[term] !== '').length
  }

  const getGradeEntryModeLabel = (subject) => {
    const mode = gradeEntryModes[subject] || 'terms'
    return mode === 'terms' ? 'Term Grades' : 'Final Grade (D2L)'
  }

  if (currentStep === 'selection') {
    return (
      <div className="liquid-glass-app">
        <div className="liquid-glass-background"></div>
        <div className="liquid-glass-container">
          <div className="liquid-glass-header">
            <div className="liquid-glass-icon-wrapper">
              <GraduationCap className="liquid-glass-icon" />
              <Sparkles className="liquid-glass-sparkle" />
            </div>
            <h1 className="liquid-glass-title">GPA Calculator</h1>
            <p className="liquid-glass-subtitle">Select the subjects you're currently taking (Max: {MAX_SUBJECTS})</p>
            <p className="liquid-glass-subtitle-small">Choose between term-based calculation or direct final grade entry for each subject</p>
          </div>

          <div className="liquid-glass-card liquid-glass-main-card">
            <div className="liquid-glass-card-header">
              <div className="liquid-glass-card-title">
                <BookOpen className="liquid-glass-card-icon" />
                Choose Your Subjects
              </div>
              <p className="liquid-glass-card-description">
                Select all the subjects you're enrolled in this semester
              </p>
            </div>
            <div className="liquid-glass-card-content">
              <div className="liquid-glass-subjects-grid">
                {Object.entries(SUBJECTS).map(([subject, weight]) => (
                  <div key={subject} className="liquid-glass-subject-item">
                    <Checkbox
                      id={subject}
                      checked={selectedSubjects.includes(subject)}
                      onCheckedChange={(checked) => handleSubjectToggle(subject, checked)}
                      disabled={!selectedSubjects.includes(subject) && selectedSubjects.length >= MAX_SUBJECTS}
                      className="liquid-glass-checkbox"
                    />
                    <label htmlFor={subject} className="liquid-glass-subject-label">
                      <div className="liquid-glass-subject-name">{subject}</div>
                      <div className="liquid-glass-subject-weight">Weight: {weight}</div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selectedSubjects.length > 0 && (
            <div className="liquid-glass-card liquid-glass-selected-card">
              <div className="liquid-glass-card-content">
                <div className="liquid-glass-selected-subjects">
                  <span className="liquid-glass-selected-label">Selected subjects:</span>
                  <div className="liquid-glass-badges">
                    {selectedSubjects.map(subject => (
                      <div key={subject} className="liquid-glass-badge">{subject}</div>
                    ))}
                  </div>
                </div>
                <button onClick={proceedToGradeEntry} className="liquid-glass-button liquid-glass-primary-button">
                  <span>Continue to Grade Entry</span>
                  <Calculator className="liquid-glass-button-icon" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="liquid-glass-app">
      <div className="liquid-glass-background"></div>
      <div className="liquid-glass-container liquid-glass-grade-container">
        <div className="liquid-glass-header">
          <div className="liquid-glass-icon-wrapper">
            <GraduationCap className="liquid-glass-icon" />
            <Sparkles className="liquid-glass-sparkle" />
          </div>
          <h1 className="liquid-glass-title">GPA Calculator</h1>
          <p className="liquid-glass-subtitle-small">Enter your grades using terms or final grades from D2L</p>
          <button onClick={resetCalculator} className="liquid-glass-button liquid-glass-secondary-button">
            Change Subjects
          </button>
        </div>

        <div className="liquid-glass-grade-layout">
          {/* Grade Entry Section */}
          <div className="liquid-glass-grade-entry">
            <div className="liquid-glass-card">
              <div className="liquid-glass-card-header">
                <div className="liquid-glass-card-title">
                  <Calendar className="liquid-glass-card-icon" />
                  Enter Grades
                </div>
                <p className="liquid-glass-card-description">
                  Choose between term-based calculation or direct final grade entry for each subject
                </p>
              </div>
              <div className="liquid-glass-card-content">
                <div className="liquid-glass-term-selector">
                  <div className="liquid-glass-term-selector-label-group">
                    <span className="liquid-glass-term-selector-label">Current Term</span>
                  </div>
                  <Select value={currentTerm} onValueChange={setCurrentTerm}>
                    <SelectTrigger className="liquid-glass-select liquid-glass-term-select">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent className="liquid-glass-select-content">
                      {TERMS.map(term => (
                        <SelectItem key={term} value={term} className="liquid-glass-select-item">
                          {term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Global Mode Toggle */}
                {selectedSubjects.length > 0 && (
                  <div className="liquid-glass-global-toggle">
                    <button
                      onClick={handleGlobalModeToggle}
                      className="liquid-glass-global-toggle-button"
                    >
                      {getGlobalModeStatus() === 'final' ? (
                        <ToggleRight className="liquid-glass-toggle-icon liquid-glass-toggle-active" />
                      ) : (
                        <ToggleLeft className="liquid-glass-toggle-icon" />
                      )}
                      <span className="liquid-glass-toggle-label">
                        {getGlobalModeStatus() === 'final' 
                          ? 'Switch All to Term Grades' 
                          : getGlobalModeStatus() === 'terms'
                          ? 'Switch All to Final Grades (D2L)'
                          : 'Switch All to Final Grades (D2L)'}
                      </span>
                    </button>
                    <p className="liquid-glass-global-toggle-description">
                      {getGlobalModeStatus() === 'final' 
                        ? 'All subjects are using final grade entry'
                        : getGlobalModeStatus() === 'terms'
                        ? 'All subjects are using term-based calculation'
                        : 'Mixed modes - some subjects use terms, others use final grades'}
                    </p>
                  </div>
                )}
                
                <div className="liquid-glass-subjects-terms">
                  {selectedSubjects.map(subject => {
                    const mode = gradeEntryModes[subject] || 'terms'
                    const termsForSubject = getTermsForSubject(subject)
                    const termsCompleted = getSubjectTermsCompleted(subject)
                    const totalTermsRequired = termsForSubject.length || 1
                    const progressWidth = totalTermsRequired === 0 ? 0 : (termsCompleted / totalTermsRequired) * 100
                    const showSemesterFinal = canCaptureSemesterFinal(subject)
                    return (
                      <div key={subject} className="liquid-glass-subject-terms-group">
                        <div className="liquid-glass-subject-header">
                          <h3 className="liquid-glass-subject-title">{subject}</h3>
                          <div className="liquid-glass-subject-info">
                            <span className="liquid-glass-weight-badge">Weight: {SUBJECTS[subject]}</span>
                            {finalGrades[subject] && (
                              <span className="liquid-glass-final-grade-badge">
                                Final: {finalGrades[subject].grade} ({finalGrades[subject].points.toFixed(1)} pts)
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Grade Entry Mode Toggle */}
                        <div className="liquid-glass-mode-toggle">
                          <button
                            onClick={() => handleGradeEntryModeToggle(subject)}
                            className="liquid-glass-toggle-button"
                          >
                            {mode === 'terms' ? (
                              <ToggleLeft className="liquid-glass-toggle-icon" />
                            ) : (
                              <ToggleRight className="liquid-glass-toggle-icon liquid-glass-toggle-active" />
                            )}
                            <span className="liquid-glass-toggle-label">
                              {getGradeEntryModeLabel(subject)}
                            </span>
                          </button>
                        </div>

                        {mode === 'terms' ? (
                          // Term-based grade entry
                          <>
                            <div className="liquid-glass-terms-grid">
                              {termsForSubject.map(term => (
                                <div key={term} className="liquid-glass-term-input">
                                  <label className="liquid-glass-term-label">{term}</label>
                                  <Select
                                    value={termGrades[subject]?.[term] || ''}
                                    onValueChange={(value) => handleTermGradeChange(subject, term, value)}
                                  >
                                    <SelectTrigger className="liquid-glass-select">
                                      <SelectValue placeholder="Select grade" />
                                    </SelectTrigger>
                                    <SelectContent className="liquid-glass-select-content">
                                      {GRADE_OPTIONS.map(grade => (
                                        <SelectItem key={grade} value={grade} className="liquid-glass-select-item">
                                          {grade} ({GRADES[grade]} pts)
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ))}
                            </div>
                            <div className="liquid-glass-progress-indicator">
                              <span className="liquid-glass-progress-text">
                                {termsCompleted}/{totalTermsRequired} {totalTermsRequired === 1 ? 'term' : 'terms'} completed
                              </span>
                              <div className="liquid-glass-progress-bar">
                                <div 
                                  className="liquid-glass-progress-fill"
                                  style={{ width: `${progressWidth}%` }}
                                ></div>
                              </div>
                            </div>
                            {showSemesterFinal && (
                              <div className="liquid-glass-semester-final">
                                <div className="liquid-glass-final-grade-input">
                                  <label className="liquid-glass-final-grade-label">Final Grade from D2L</label>
                                  <Select
                                    value={termFinalGrades[subject] || ''}
                                    onValueChange={(value) => handleTermFinalGradeChange(subject, value)}
                                  >
                                    <SelectTrigger className="liquid-glass-select liquid-glass-final-select">
                                      <SelectValue placeholder="Enter final grade" />
                                    </SelectTrigger>
                                    <SelectContent className="liquid-glass-select-content">
                                      {GRADE_OPTIONS.map(grade => (
                                        <SelectItem key={grade} value={grade} className="liquid-glass-select-item">
                                          {grade} ({GRADES[grade]} pts)
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="liquid-glass-final-grade-indicator">
                                  <span className="liquid-glass-final-grade-status">
                                    {termFinalGrades[subject] ? 'Final grade recorded' : 'No final grade recorded yet'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          // Direct final grade entry
                          <div className="liquid-glass-final-grade-entry">
                            <div className="liquid-glass-final-grade-input">
                              <label className="liquid-glass-final-grade-label">Final Grade from D2L</label>
                              <Select
                                value={directFinalGrades[subject] || ''}
                                onValueChange={(value) => handleDirectFinalGradeChange(subject, value)}
                              >
                                <SelectTrigger className="liquid-glass-select liquid-glass-final-select">
                                  <SelectValue placeholder="Enter final grade" />
                                </SelectTrigger>
                                <SelectContent className="liquid-glass-select-content">
                                  {GRADE_OPTIONS.map(grade => (
                                    <SelectItem key={grade} value={grade} className="liquid-glass-select-item">
                                      {grade} ({GRADES[grade]} pts)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="liquid-glass-final-grade-indicator">
                              <span className="liquid-glass-final-grade-status">
                                {directFinalGrades[subject] ? 'Final grade entered' : 'No final grade entered'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="liquid-glass-results">
            {/* Current GPA */}
            <div className="liquid-glass-card liquid-glass-gpa-card">
              <div className="liquid-glass-card-header">
                <div className="liquid-glass-card-title">
                  <Calculator className="liquid-glass-card-icon" />
                  Current GPA
                </div>
              </div>
              <div className="liquid-glass-card-content">
                <div className="liquid-glass-gpa-display">
                  <div className="liquid-glass-gpa-number">
                    {gpa !== null ? gpa.toFixed(2) : '--'}
                  </div>
                  <div className="liquid-glass-gpa-max">out of 15.00</div>
                </div>
              </div>
            </div>

            {/* Save to Google Doc Button */}
            {gpa && gpa > 0 && (
              <div className="liquid-glass-card">
                <div className="liquid-glass-card-content">
                  <button 
                    onClick={() => setShowSaveDialog(true)}
                    className="liquid-glass-button liquid-glass-save-button"
                  >
                    <Save className="liquid-glass-button-icon-left" />
                    <span>Save to Google Doc</span>
                    <FileText className="liquid-glass-button-icon" />
                  </button>
                </div>
              </div>
            )}

            {/* Grade Requirements */}
            <div className="liquid-glass-card liquid-glass-requirements-card">
              <div className="liquid-glass-card-header">
                <div className="liquid-glass-card-title">
                  <Target className="liquid-glass-card-icon" />
                  Grade Requirements
                </div>
                <p className="liquid-glass-card-description">
                  What final grades you need for target GPAs
                </p>
              </div>
              <div className="liquid-glass-card-content">
                <div className="liquid-glass-requirements">
                  {[13.5, 14.0, 14.5].map(targetGPA => {
                    const requirements = calculateRequiredGrades(targetGPA)
                    const hasUnenteredGrades = Object.keys(requirements.grades).length > 0
                    
                    return (
                      <div key={targetGPA} className="liquid-glass-requirement-item">
                        <div className="liquid-glass-requirement-header">
                          <h4 className="liquid-glass-requirement-title">Target GPA: {targetGPA}</h4>
                          <div className={`liquid-glass-requirement-badge ${requirements.possible ? 'liquid-glass-badge-success' : 'liquid-glass-badge-error'}`}>
                            {requirements.possible ? "Achievable" : "Not Possible"}
                          </div>
                        </div>
                        
                        {requirements.possible && hasUnenteredGrades && (
                          <div className="liquid-glass-requirement-details">
                            <p className="liquid-glass-requirement-label">Required final grades:</p>
                            <div className="liquid-glass-requirement-grades">
                              {Object.entries(requirements.grades).map(([subject, requiredGrade]) => (
                                <div key={subject} className="liquid-glass-requirement-grade">
                                  <span className="liquid-glass-requirement-subject">{subject}:</span>
                                  <div className="liquid-glass-requirement-grade-badge">{requiredGrade}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {requirements.possible && !hasUnenteredGrades && (
                          <p className="liquid-glass-requirement-message liquid-glass-success-message">
                            {gpa >= targetGPA ? "Already achieved!" : "All grades entered"}
                          </p>
                        )}
                        
                        {!requirements.possible && (
                          <p className="liquid-glass-requirement-message liquid-glass-error-message">
                            Target GPA not achievable with remaining subjects
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save to Google Doc Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={handleSaveDialogClose}>
          <DialogContent className="liquid-glass-dialog">
            <DialogHeader>
              <DialogTitle className="liquid-glass-dialog-title">
                <Save className="liquid-glass-dialog-icon" />
                Save to Google Doc
              </DialogTitle>
            </DialogHeader>
            <div className="liquid-glass-dialog-content" style={{ padding: '24px 20px' }}>
              <div className="liquid-glass-input-group" style={{ marginBottom: '20px' }}>
                <label className="liquid-glass-input-label" style={{ marginBottom: '8px', display: 'block' }}>Your Name:</label>
                <Input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your name..."
                  className="liquid-glass-input"
                />
              </div>
              <div className="liquid-glass-gpa-summary" style={{ padding: '16px', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px' }}>
                <p className="liquid-glass-summary-text" style={{ fontSize: '18px', textAlign: 'center', margin: 0 }}>
                  GPA: <span className="liquid-glass-gpa-highlight">{gpa?.toFixed(2)}</span>
                </p>
              </div>
            </div>
            <DialogFooter className="liquid-glass-dialog-footer" style={{ padding: '16px 20px', gap: '12px' }}>
              <Button
                onClick={handleSaveDialogClose}
                variant="outline"
                className="liquid-glass-dialog-button liquid-glass-dialog-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={saveToGoogleDoc}
                disabled={isSaving || !studentName.trim()}
                className="liquid-glass-dialog-button liquid-glass-dialog-save"
              >
                {isSaving ? (
                  <>
                    <div className="liquid-glass-spinner"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="liquid-glass-button-icon-left" />
                    Save to Doc
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default App

