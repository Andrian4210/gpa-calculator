// Google Apps Script to save GPA data to Google Doc
// Deploy this as a Web App with "Execute as: Me" and "Who has access: Anyone"

const GOOGLE_DOC_ID = '1ICuIvuBC-uTpdKCgQWYNKqAfPfnOzOQPIyLYMoXhqvo';

// Content moderation function
function isInappropriateName(name) {
  // Convert to lowercase for case-insensitive checking
  const lowerName = name.toLowerCase().trim();
  
  // List of inappropriate words/patterns
  const inappropriateWords = [
    'fuck', 'shit', 'damn', 'bitch', 'ass', 'crap', 'piss', 'dick', 'cock', 
    'pussy', 'cunt', 'bastard', 'whore', 'slut', 'nigger', 'nigga', 'fag', 
    'faggot', 'retard', 'penis', 'vagina', 'sex', 'porn', 'xxx', 'kill', 
    'die', 'death', 'hitler', 'nazi', 'kkk', 'terrorist', 'bomb', 'rape',
    'idiot', 'stupid', 'dumb', 'moron', 'loser', 'hate', 'kys'
  ];
  
  // Check if name contains any inappropriate words
  for (let word of inappropriateWords) {
    if (lowerName.includes(word)) {
      return true;
    }
  }
  
  // Check for excessive special characters or numbers (likely fake names)
  const specialCharCount = (lowerName.match(/[^a-z\s\-']/g) || []).length;
  if (specialCharCount > 3) {
    return true;
  }
  
  // Check if name is too short (less than 2 characters)
  if (lowerName.replace(/\s/g, '').length < 2) {
    return true;
  }
  
  // Check for repeated characters (like "aaaaaaa" or "111111")
  const hasExcessiveRepetition = /(.)\1{4,}/.test(lowerName);
  if (hasExcessiveRepetition) {
    return true;
  }
  
  return false;
}

function doPost(e) {
  try {
    // Parse the incoming data - handle both JSON and form data
    let data;
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        // If not JSON, try parsing as form data
        data = JSON.parse(e.parameter.data || e.parameters.data[0]);
      }
    } else if (e.parameter && e.parameter.data) {
      data = JSON.parse(e.parameter.data);
    } else {
      throw new Error('No data received');
    }
    
    // Validate student name
    if (!data.studentName || !data.studentName.trim()) {
      throw new Error('Student name is required');
    }
    
    if (isInappropriateName(data.studentName)) {
      throw new Error('The name provided appears to be inappropriate or invalid. Please use your real name.');
    }
    
    // Open the Google Doc
    const doc = DocumentApp.openById(GOOGLE_DOC_ID);
    const body = doc.getBody();
    
    // Get the current term from the data
    const currentTerm = data.currentTerm || 'Unknown Term';
    
    // Look for existing term section
    let table = null;
    const paragraphs = body.getParagraphs();
    let termHeadingIndex = -1;
    
    // Search for the term heading
    for (let i = 0; i < paragraphs.length; i++) {
      const text = paragraphs[i].getText();
      if (text === currentTerm) {
        termHeadingIndex = i;
        break;
      }
    }
    
    if (termHeadingIndex === -1) {
      // Term section doesn't exist, create it
      // If this is the first term, add main heading
      if (body.getNumChildren() === 0) {
        body.appendParagraph('GPA Records').setHeading(DocumentApp.ParagraphHeading.HEADING1);
        body.appendParagraph(''); // Spacing
      }
      
      // Add term heading
      const termHeading = body.appendParagraph(currentTerm);
      termHeading.setHeading(DocumentApp.ParagraphHeading.HEADING2);
      termHeading.setForegroundColor('#8B5CF6');
      body.appendParagraph(''); // Spacing
      
      // Create table with headers
      table = body.appendTable();
      const headerRow = table.appendTableRow();
      headerRow.appendTableCell('Date');
      headerRow.appendTableCell('Student Name');
      headerRow.appendTableCell('Current GPA');
      headerRow.appendTableCell('Subjects');
      
      // Style header row
      for (let i = 0; i < 4; i++) {
        const cell = headerRow.getCell(i);
        cell.setBackgroundColor('#8B5CF6');
        cell.getChild(0).asText().setForegroundColor('#FFFFFF').setBold(true);
        cell.setPaddingTop(8).setPaddingBottom(8).setPaddingLeft(8).setPaddingRight(8);
      }
      
      body.appendParagraph(''); // Spacing after table
    } else {
      // Find the table after the term heading
      const allTables = body.getTables();
      for (let i = 0; i < allTables.length; i++) {
        const tableIndex = body.getChildIndex(allTables[i]);
        if (tableIndex > termHeadingIndex) {
          table = allTables[i];
          break;
        }
      }
      
      // If no table found after heading, create one
      if (!table) {
        const termParagraph = paragraphs[termHeadingIndex];
        const termIndex = body.getChildIndex(termParagraph);
        
        table = body.insertTable(termIndex + 1);
        const headerRow = table.appendTableRow();
        headerRow.appendTableCell('Date');
        headerRow.appendTableCell('Student Name');
        headerRow.appendTableCell('Current GPA');
        headerRow.appendTableCell('Subjects');
        
        // Style header row
        for (let i = 0; i < 4; i++) {
          const cell = headerRow.getCell(i);
          cell.setBackgroundColor('#8B5CF6');
          cell.getChild(0).asText().setForegroundColor('#FFFFFF').setBold(true);
          cell.setPaddingTop(8).setPaddingBottom(8).setPaddingLeft(8).setPaddingRight(8);
        }
      }
    }
    
    // Format the data
    const timestamp = new Date(data.timestamp).toLocaleDateString();
    const subjectsText = data.subjects
      .map(s => `${s.subject}: ${s.finalGrade || 'Incomplete'}`)
      .join('\n');
    
    // Add new row
    const newRow = table.appendTableRow();
    newRow.appendTableCell(timestamp);
    newRow.appendTableCell(data.studentName);
    newRow.appendTableCell(String(data.gpa || data.currentGpa || 'N/A'));
    newRow.appendTableCell(subjectsText);
    
    // Style the new row
    for (let i = 0; i < 4; i++) {
      const cell = newRow.getCell(i);
      cell.setPaddingTop(8).setPaddingBottom(8).setPaddingLeft(8).setPaddingRight(8);
      if (table.getNumRows() % 2 === 0) {
        cell.setBackgroundColor('#F3F4F6');
      }
    }
    
    // Save the document
    doc.saveAndClose();
    
    // Return success response with CORS headers
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: `Successfully saved ${data.studentName}'s GPA (${data.gpa || data.currentGpa}) to Google Doc!`,
        docUrl: `https://docs.google.com/document/d/${GOOGLE_DOC_ID}/edit`
      })
    )
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    
  } catch (error) {
    // Return error response with CORS headers
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: `Error: ${error.message}`
      })
    )
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
  }
}

// Handle preflight OPTIONS requests for CORS
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
}
