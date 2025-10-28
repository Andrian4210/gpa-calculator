// Google Apps Script to save GPA data to Google Doc
// Deploy this as a Web App with "Execute as: Me" and "Who has access: Anyone"

const GOOGLE_DOC_ID = '1ICuIvuBC-uTpdKCgQWYNKqAfPfnOzOQPIyLYMoXhqvo';

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
    
    // Open the Google Doc
    const doc = DocumentApp.openById(GOOGLE_DOC_ID);
    const body = doc.getBody();
    
    // Check if table exists, if not create it
    let table = null;
    const tables = body.getTables();
    
    if (tables.length === 0) {
      // Create header
      body.appendParagraph('GPA Records').setHeading(DocumentApp.ParagraphHeading.HEADING1);
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
    } else {
      table = tables[0];
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
