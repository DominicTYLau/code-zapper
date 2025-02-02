const vscode = require('vscode');
const {SerialPort} = require('serialport');

// Store interval IDs for cleanup
const intervalIds = {};

// Initialize the serial port
const port = new SerialPort({ path: '/dev/cu.usbmodem11201', baudRate: 9600 });

// Activate the extension
function activate(context) {
  // Register the command to start monitoring
  const disposable = vscode.commands.registerCommand('extension.monitor', () => {
    vscode.window.showInformationMessage('Monitoring terminal for errors...');
    startMonitoring();
  });

  // Add the command to the extension's subscriptions
  context.subscriptions.push(disposable);

  // Start monitoring immediately upon activation (optional)
  startMonitoring();
}

// Deactivate the extension
function deactivate() {
  // Clean up intervals
  Object.values(intervalIds).forEach(intervalId => clearInterval(intervalId));
  port.close(); // Close the serial port
}

// Start monitoring the terminal
function startMonitoring() {
  const interval = setInterval(async () => {
    try {
      await checkTerminal();
    } catch (error) {
      console.error('Error during terminal monitoring:', error);
      vscode.window.showErrorMessage('Failed to monitor terminal output.');
    }
  }, 1000); // Check every second

  // Store the interval ID for cleanup
  intervalIds['monitoring'] = interval;
}

// Check the terminal for errors
async function checkTerminal() {
  // Save the original clipboard content
  const originalClipboard = await vscode.env.clipboard.readText();

  try {
    // Select all text in the terminal and copy it
    await vscode.commands.executeCommand('workbench.action.terminal.selectAll');
    await vscode.commands.executeCommand('workbench.action.terminal.copySelection');

    // Read the terminal output from the clipboard
    const terminalOutput = await vscode.env.clipboard.readText();

    // Check if the terminal output contains an error
    if (containsError(terminalOutput)) {
      vscode.window.showErrorMessage('Error detected in terminal output!');
      port.write('1'); // Send '1' to the serial port if an error is found
    } else {
      port.write('0'); // Send '0' if no error is found
    }
  } finally {
    // Restore the original clipboard content
    await vscode.env.clipboard.writeText(originalClipboard);

    // Clear the terminal selection
    await vscode.commands.executeCommand('workbench.action.terminal.clearSelection');

    // Return focus to the editor
    await vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
  }
}

// Check if the data contains any error patterns
function containsError(data) {
  const errorPatterns = [
    /error:/i, // Matches "error:"
    /fail/i,   // Matches "fail"
    /exception/i, // Matches "exception"
    /not found/i, // Matches "not found"
    /failed/i, // Matches "failed"
  ];

  return errorPatterns.some(pattern => pattern.test(data));
}

// Export the activate and deactivate functions
module.exports = {
  activate,
  deactivate
};