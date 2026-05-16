const snippets = {
‘duplicate-record’: {
title: ‘Duplicate Records’,
description: ‘Copy a record with all its field values to create a template or duplicate entry.’,
code: `const table = base.getTable(“Table Name”);
const records = await table.selectRecordsAsync({ fields: [“Field1”, “Field2”] });

const recordToDuplicate = records.records[0]; // Get first record
const newRecord = {};

// Copy all field values
for (let field of records.fields) {
newRecord[field.id] = recordToDuplicate.getCellValue(field.id);
}

// Create the duplicate
await table.createRecordsAsync([newRecord]);
output.text(“Record duplicated successfully!”);`, explanation: [ 'Select the source record you want to duplicate', 'Iterate through all fields and copy their values', 'Create a new record with the copied values', 'Use createRecordsAsync to add it to the table' ], tips: [ 'Modify field values before creating (e.g., append "Copy of" to name)', 'Use filterByFormula to select specific records instead of the first one', 'For large batches, duplicate multiple records in one call' ] }, 'update-fields': { title: 'Update Multiple Fields', description: 'Modify multiple fields in multiple records efficiently using batch updates.', code: `const table = base.getTable(“Table Name”);
const records = await table.selectRecordsAsync({ fields: [“Status”, “Updated”] });

const updates = [];
for (let record of records.records) {
updates.push({
id: record.id,
fields: {
“Status”: “Completed”,
“Updated”: new Date().toISOString()
}
});
}

// Batch update (max 100 per call)
await table.updateRecordsAsync(updates);
output.text(`Updated ${updates.length} records`);`, explanation: [ 'Query all records that need updating', 'Build an array of update objects with record ID and new field values', 'Batch update in one call (up to 100 records at once)', 'Display count of updated records' ], tips: [ 'Batch updates are 10-100x faster than updating one-by-one', 'Use filterByFormula to update only matching records', 'Always set up error handling with try/catch for failed updates' ] }, 'delete-records': { title: 'Delete Records Safely', description: 'Delete records matching a condition, with safety checks.', code: `const table = base.getTable(“Table Name”);
const records = await table.selectRecordsAsync({
filterByFormula: “{Status} = ‘Archived’”
});

const recordIds = records.records.map(r => r.id);

// Safety check
if (recordIds.length === 0) {
output.text(“No records to delete.”);
} else if (recordIds.length > 100) {
output.text(“Too many records! Delete in smaller batches.”);
} else {
await table.destroyRecordsAsync(recordIds);
output.text(`Deleted ${recordIds.length} records`);
}`, explanation: [ 'Filter records by a condition (e.g., Status = Archived)', 'Extract record IDs into an array', 'Add safety checks: empty result and batch size limits', 'Delete using destroyRecordsAsync' ], tips: [ 'Always filter before deleting to avoid accidents', 'Test on a small dataset first', 'Use a confirmation field ("Ready to Delete") before automated deletion' ] }, 'batch-update': { title: 'Batch Update with Calculations', description: 'Update records with calculated values (commissions, taxes, totals).', code: `const table = base.getTable(“Orders”);
const records = await table.selectRecordsAsync({
fields: [“Amount”, “Tax Rate”, “Total”]
});

const updates = [];
for (let record of records.records) {
const amount = record.getCellValue(“Amount”) || 0;
const taxRate = record.getCellValue(“Tax Rate”) || 0;
const total = amount + (amount * taxRate / 100);


updates.push({
    id: record.id,
    fields: { "Total": total }
});


}

// Update in batches of 100
for (let i = 0; i < updates.length; i += 100) {
await table.updateRecordsAsync(updates.slice(i, i + 100));
}
output.text(`Calculated totals for ${updates.length} records`);`, explanation: [ 'Query records with Amount and Tax Rate fields', 'Calculate Total = Amount + (Amount × TaxRate)', 'Collect updates in array', 'Batch update in chunks of 100 to avoid timeout' ], tips: [ 'Use Math.round() for currency calculations', 'Handle null/undefined values with default fallbacks', 'Log progress on large batches to monitor execution' ] }, 'bulk-email': { title: 'Send Bulk Emails', description: 'Send personalized emails using external email API (SendGrid, Mailgun).', code: `const SENDGRID_API_KEY = “your-api-key-here”; // Store securely
const table = base.getTable(“Contacts”);
const records = await table.selectRecordsAsync({
fields: [“Email”, “Name”, “Status”],
filterByFormula: “{Status} = ‘Active’”
});

const emailsSent = [];
for (let record of records.records) {
const email = record.getCellValue(“Email”);
const name = record.getCellValue(“Name”);


const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
        "Authorization": \`Bearer \${SENDGRID_API_KEY}\`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: "noreply@yoursite.com" },
        subject: \`Hello, \${name}!\`,
        content: [{ type: "text/html", value: \`<p>Hi \${name},</p><p>Thank you!</p>\` }]
    })
});

emailsSent.push(email);


}

output.text(`Sent emails to ${emailsSent.length} contacts`);`, explanation: [ 'Query contacts that match send criteria (Active status)', 'Loop through each contact and prepare email object', 'Call SendGrid API (or similar) to send personalized email', 'Log sent count' ], tips: [ 'Use environment variables to store API keys securely', 'Test with single email first before sending bulk', 'Add error handling for failed email sends', 'Track sent emails by updating a "Sent" date field' ] }, 'fetch-api': { title: 'Fetch External API Data', description: 'Pull data from external APIs and populate Airtable records.', code: `const table = base.getTable(“Products”);
const records = await table.selectRecordsAsync({
fields: [“SKU”, “Price”]
});

const updates = [];
for (let record of records.records) {
const sku = record.getCellValue(“SKU”);


try {
    // Fetch current price from external API
    const response = await fetch(\`https://api.example.com/price?sku=\${sku}\`);
    const data = await response.json();
    
    updates.push({
        id: record.id,
        fields: { "Price": data.currentPrice }
    });
} catch (error) {
    output.text(\`Error fetching \${sku}: \${error.message}\`);
}


}

await table.updateRecordsAsync(updates);
output.text(`Updated prices for ${updates.length} products`);`, explanation: [ 'Query records containing identifiers (SKU)', 'For each record, call external API with the identifier', 'Parse JSON response and extract needed data', 'Update records with fetched values', 'Handle errors gracefully' ], tips: [ 'Use try/catch for API failures', 'Add rate limiting to avoid hitting API limits', 'Cache results to reduce API calls', 'Log failed requests for debugging' ] }, 'filter-data': { title: 'Filter & Export Data', description: 'Filter records by criteria and export to formatted output.', code: `const table = base.getTable(“Sales”);
const records = await table.selectRecordsAsync({
fields: [“Date”, “Amount”, “Status”],
filterByFormula: “AND({Status} = ‘Completed’, {Amount} > 1000)”
});

let totalSales = 0;
const filteredData = [];

for (let record of records.records) {
const amount = record.getCellValue(“Amount”);
totalSales += amount;


filteredData.push({
    date: record.getCellValue("Date"),
    amount: amount,
    status: record.getCellValue("Status")
});


}

// Output formatted table
output.markdown(`## Completed Sales > $1000\n`);
output.table(filteredData);
output.markdown(`**Total Sales: $${totalSales.toFixed(2)}`);`, explanation: [ 'Use filterByFormula to query matching records', 'Loop through results and aggregate data', 'Format data for display (currency, dates)', 'Output as markdown table or formatted text' ], tips: [ 'Use filterByFormula for complex filtering instead of loops', 'Format currency with .toFixed(2) for cents', 'Use output.table() for readable data exports' ] }, 'timestamp': { title: 'Add Timestamps', description: 'Automatically add created/modified timestamps to records.', code: `const table = base.getTable(“Tasks”);
const records = await table.selectRecordsAsync({
fields: [“Title”, “Created”]
});

const updates = [];
const now = new Date().toISOString();

for (let record of records.records) {
// Add timestamp to records without one
if (!record.getCellValue(“Created”)) {
updates.push({
id: record.id,
fields: { “Created”: now }
});
}
}

if (updates.length > 0) {
await table.updateRecordsAsync(updates);
output.text(`Added timestamps to ${updates.length} records`);
} else {
output.text(“All records have timestamps.”);
}`, explanation: [ 'Get current timestamp as ISO format', 'Check each record for existing Created field', 'Update records missing timestamps', 'Batch update all at once' ], tips: [ 'Use ISO 8601 format (toISOString()) for consistency', 'Run once on init, then use automation triggers for new records', 'Create "Last Modified" field updated on any change' ] }, 'slack-notify': { title: 'Send Slack Notifications', description: 'Send alerts and summaries to Slack from Airtable.', code: `const SLACK_WEBHOOK = “https://hooks.slack.com/services/YOUR/WEBHOOK/URL”;
const table = base.getTable(“Incidents”);
const records = await table.selectRecordsAsync({
fields: [“Title”, “Severity”, “Status”],
filterByFormula: “{Status} = ‘Open’”
});

const message = {
text: `🚨 Open Incidents: ${records.records.length}`,
blocks: [
{
type: “header”,
text: { type: “plain_text”, text: “Open Incidents Report” }
},
…records.records.map(r => ({
type: “section”,
text: {
type: “mrkdwn”,
text: `*${r.getCellValue(“Title”)}*\nSeverity: ${r.getCellValue(“Severity”)}`
}
}))
]
};

const response = await fetch(SLACK_WEBHOOK, {
method: “POST”,
body: JSON.stringify(message)
});

output.text(“Slack notification sent!”);`,
explanation: [
‘Get your Slack webhook URL from your workspace’,
‘Query records matching alert criteria’,
‘Format message as JSON with blocks’,
‘POST to Slack webhook URL’
],
tips: [
‘Use Slack Block Kit for rich formatting’,
‘Include record links for easy access from Slack’,
‘Schedule script to run daily for digests’,
‘Test webhook first with simple text message’
]
}
};

function loadSnippet() {
const category = document.getElementById(‘snippetCategory’).value;
const snippet = snippets[category];


if (!snippet) return;

document.getElementById('snippetTitle').textContent = snippet.title;
document.getElementById('snippetDescription').textContent = snippet.description;
document.getElementById('snippetCode').textContent = snippet.code;

const explanationList = document.getElementById('explanationList');
explanationList.innerHTML = '';
snippet.explanation.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    explanationList.appendChild(li);
});

const tipsList = document.getElementById('tipsList');
tipsList.innerHTML = '';
snippet.tips.forEach(tip => {
    const li = document.createElement('li');
    li.textContent = tip;
    tipsList.appendChild(li);
});

document.getElementById('snippetDisplay').style.display = 'block';


}

function copySnippet() {
const code = document.getElementById(‘snippetCode’).textContent;
navigator.clipboard.writeText(code).then(() => {
const btn = event.target;
const originalText = btn.textContent;
btn.textContent = ‘Copied! ✓’;
setTimeout(() => {
btn.textContent = originalText;
}, 2000);
});
}

// Initialize
document.addEventListener(‘DOMContentLoaded’, function() {
document.getElementById(‘snippetCategory’).value = ‘duplicate-record’;
});