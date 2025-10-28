# GPA Calculator Application Design Plan

## Requirements Analysis

### Grade Scale
- A+ = 15, A = 14, A- = 13
- B+ = 12, B = 11, B- = 10
- C+ = 9, C = 8, C- = 7
- D+ = 6, D = 5, D- = 4
- F+ = 3, F = 2, F- = 1

### Subject Weightings
- Visual art/media/drama/music: 0.3
- Spanish/japanese: 0.6
- HPE (Health & Physical Education): 0.6
- Digital/design: 0.3
- Math: 1.0
- Science: 1.0
- English: 1.0
- Humanities: 1.0

### GPA Formula
GPA = (Sum of weighted grades) / 5.8

## Application Features

### 1. Subject Selection Screen
- Initial screen where users select which subjects they're taking
- Checkbox interface for each subject
- Continue button to proceed to grade entry

### 2. Grade Entry Interface
- Form with dropdowns for each selected subject
- Grade options from A+ to F-
- Real-time GPA calculation display
- Clear, intuitive layout

### 3. Results Display
- Current GPA prominently displayed
- Table showing grade requirements for target GPAs (13.5, 14, 14.5)
- Only show predictions for subjects without grades entered

## UI/UX Design Approach

### Visual Design
- Modern, clean interface with good contrast
- Card-based layout for better organization
- Responsive design for mobile and desktop
- Professional color scheme (blues/grays with accent colors)

### Interactive Elements
- Smooth transitions between screens
- Hover effects on buttons and cards
- Loading states for calculations
- Form validation and feedback

### User Experience
- Progressive disclosure (subject selection → grade entry → results)
- Clear navigation and progress indication
- Helpful tooltips and explanations
- Error handling and validation messages

## Technical Implementation

### Technology Stack
- React.js for frontend framework
- CSS modules or styled-components for styling
- Local state management (useState/useReducer)
- Responsive CSS Grid/Flexbox layout

### Component Structure
- App (main container)
- SubjectSelection (initial screen)
- GradeEntry (main calculator interface)
- GPADisplay (results section)
- GradePredictionTable (target GPA requirements)
- Common components (Button, Card, Select, etc.)

### Key Algorithms
1. GPA Calculation: Apply weightings and divide by 5.8
2. Grade Prediction: Reverse calculation to find required grades for target GPAs
3. Form Validation: Ensure all required fields are handled properly

