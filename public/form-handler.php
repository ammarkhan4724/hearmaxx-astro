<?php
/**
 * Hear Maxx - Static Site Form Handler
 * Handles Contact and Appointment requests and sends notifications to Info@hearmaxx.ca
 */

header('Content-Type: application/json; charset=UTF-8');

// Allow same-origin POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
    exit;
}

// 1. Anti-spam honeypot check
if (!empty($_POST['_hp_check'])) {
    // Bot detected: return 200 silently without mailing
    echo json_encode(['status' => 'success', 'message' => 'Request received.']);
    exit;
}

// 2. Extract and sanitize inputs
$formType  = trim(strip_tags($_POST['form_type'] ?? 'General Inquiry'));
$fullName  = trim(strip_tags($_POST['full_name'] ?? ''));
$email     = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$phone     = trim(strip_tags($_POST['phone'] ?? ''));
$clinic    = trim(strip_tags($_POST['clinic'] ?? 'Not specified'));
$preferredDate = trim(strip_tags($_POST['preferred_date'] ?? ''));
$preferredTime = trim(strip_tags($_POST['preferred_time'] ?? ''));
$serviceType   = trim(strip_tags($_POST['service_type'] ?? ''));
$message   = trim(strip_tags($_POST['message'] ?? ''));

// 3. Validation
$errors = [];
if (empty($fullName)) {
    $errors[] = 'Full name is required.';
}
if (empty($phone) && (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL))) {
    $errors[] = 'A valid phone number or email address is required.';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => implode(' ', $errors)]);
    exit;
}

// 4. Build email message
$to = 'Info@hearmaxx.ca';
$subject = "[Hear Maxx Website] New " . ucfirst($formType) . " from " . $fullName;

$emailBody = "You have received a new submission from the Hear Maxx website.\n\n";
$emailBody .= "--------------------------------------------------\n";
$emailBody .= "Form Type: " . $formType . "\n";
$emailBody .= "Name: " . $fullName . "\n";
$emailBody .= "Phone: " . $phone . "\n";
$emailBody .= "Email: " . $email . "\n";
$emailBody .= "Preferred Clinic: " . $clinic . "\n";

if (!empty($serviceType)) {
    $emailBody .= "Service Requested: " . $serviceType . "\n";
}
if (!empty($preferredDate)) {
    $emailBody .= "Preferred Date: " . $preferredDate . "\n";
}
if (!empty($preferredTime)) {
    $emailBody .= "Preferred Time: " . $preferredTime . "\n";
}
if (!empty($message)) {
    $emailBody .= "Message / Notes:\n" . $message . "\n";
}

$emailBody .= "--------------------------------------------------\n";
$emailBody .= "Submission Date: " . date('Y-m-d H:i:s T') . "\n";
$emailBody .= "IP Address: " . ($_SERVER['REMOTE_ADDR'] ?? 'Unknown') . "\n";

$headers = [];
$headers[] = 'From: Hear Maxx Website <noreply@hearmaxx.ca>';
if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $headers[] = 'Reply-To: ' . $fullName . ' <' . $email . '>';
}
$headers[] = 'X-Mailer: PHP/' . phpversion();

// 5. Send email
$mailSent = @mail($to, $subject, $emailBody, implode("\r\n", $headers));

// 6. Respond (JSON for fetch or redirect for standard HTML form submission)
$isAjax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
if (!$isAjax && !empty($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') === false) {
    // Non-AJAX fallback: redirect to referer with status parameter
    $referer = $_SERVER['HTTP_REFERER'] ?? '/';
    $separator = (strpos($referer, '?') !== false) ? '&' : '?';
    header('Location: ' . $referer . $separator . 'submitted=1');
    exit;
}

echo json_encode([
    'status' => 'success',
    'message' => 'Thank you! Your request has been received. Our clinical team will contact you promptly to confirm.'
]);
exit;
