<?php
/**
 * Hear Maxx - Production Form Handler
 * Processes Appointment Bookings & Contact Inquiries.
 * Sends styled HTML notifications to Clinic Owner and Confirmation to Client.
 */

// Strict error reporting for debugging while catching errors cleanly
error_reporting(E_ALL);
ini_set('display_errors', '0');

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

// 2. Load optional configuration (from email-config.php if present, else environment / defaults)
$configFile = __DIR__ . '/email-config.php';
$config = [
    'owner_email' => getenv('HEARMAXX_OWNER_EMAIL') ?: 'Info@hearmaxx.ca',
    'from_email'  => getenv('HEARMAXX_FROM_EMAIL') ?: 'noreply@hearmaxx.ca',
    'from_name'   => 'Hear Maxx',
    'site_url'    => getenv('PUBLIC_SITE_URL') ?: 'https://hearmaxx.ca',
    'use_smtp'    => filter_var(getenv('HEARMAXX_USE_SMTP') ?: false, FILTER_VALIDATE_BOOLEAN),
    'smtp_host'   => getenv('HEARMAXX_SMTP_HOST') ?: '',
    'smtp_port'   => intval(getenv('HEARMAXX_SMTP_PORT') ?: 465),
    'smtp_secure' => getenv('HEARMAXX_SMTP_SECURE') ?: 'ssl', // 'ssl' or 'tls'
    'smtp_user'   => getenv('HEARMAXX_SMTP_USER') ?: '',
    'smtp_pass'   => getenv('HEARMAXX_SMTP_PASS') ?: '',
];

if (file_exists($configFile)) {
    $customConfig = include $configFile;
    if (is_array($customConfig)) {
        $config = array_merge($config, $customConfig);
    }
}

// 3. Extract and sanitize inputs
$formType      = strtolower(trim(strip_tags($_POST['form_type'] ?? 'appointment')));
$fullName      = trim(strip_tags($_POST['full_name'] ?? ''));
$email         = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$phone         = trim(strip_tags($_POST['phone'] ?? ''));
$clinic        = trim(strip_tags($_POST['clinic'] ?? 'Mississauga Clinic'));
$preferredDate = trim(strip_tags($_POST['preferred_date'] ?? ''));
$preferredTime = trim(strip_tags($_POST['preferred_time'] ?? ''));
$serviceType   = trim(strip_tags($_POST['service_type'] ?? ''));
$message       = trim(strip_tags($_POST['message'] ?? ''));

// 4. Validation
$errors = [];
if (empty($fullName)) {
    $errors[] = 'Full name is required.';
}
if (empty($phone)) {
    $errors[] = 'Phone number is required.';
}
if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => implode(' ', $errors)]);
    exit;
}

// 5. Build HTML Email Templates
$logoUrl = rtrim($config['site_url'], '/') . '/images/hear-maxx-logo.png';

/**
 * Send an email using configured transport (SMTP socket or PHP mail)
 */
function sendHearMaxxMail($to, $subject, $htmlContent, $replyToEmail, $replyToName, $config) {
    if (empty($to)) return false;

    // Try SMTP if enabled and host provided
    if (!empty($config['use_smtp']) && !empty($config['smtp_host'])) {
        $smtpResult = sendViaSmtpSocket($to, $subject, $htmlContent, $replyToEmail, $replyToName, $config);
        if ($smtpResult) return true;
    }

    // Standard PHP mail fallback with proper MIME headers
    $fromHeader = '=?UTF-8?B?' . base64_encode($config['from_name']) . '?= <' . $config['from_email'] . '>';
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'From: ' . $fromHeader,
        'Date: ' . date('r'),
        'X-Mailer: PHP/' . phpversion()
    ];

    if (!empty($replyToEmail) && filter_var($replyToEmail, FILTER_VALIDATE_EMAIL)) {
        $replyName = !empty($replyToName) ? '=?UTF-8?B?' . base64_encode($replyToName) . '?= ' : '';
        $headers[] = 'Reply-To: ' . $replyName . '<' . $replyToEmail . '>';
    }

    $headerStr = implode("\r\n", $headers);
    $envelopeSender = '-f' . $config['from_email'];

    // Send with envelope sender flag
    $sent = @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $htmlContent, $headerStr, $envelopeSender);
    if (!$sent) {
        // Fallback without -f in case safe mode / restrict options are enabled
        $sent = @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $htmlContent, $headerStr);
    }

    return $sent;
}

/**
 * Lightweight, zero-dependency SMTP Socket Sender
 */
function sendViaSmtpSocket($to, $subject, $htmlContent, $replyToEmail, $replyToName, $config) {
    $host = $config['smtp_host'];
    $port = $config['smtp_port'];
    $secure = strtolower($config['smtp_secure']);
    $user = $config['smtp_user'];
    $pass = $config['smtp_pass'];
    $from = $config['from_email'];

    $protocol = ($secure === 'ssl') ? 'ssl://' : '';
    $timeout = 10;
    $socket = @fsockopen($protocol . $host, $port, $errno, $errstr, $timeout);

    if (!$socket) {
        error_log("Hear Maxx SMTP Error: Connection to $host:$port failed - $errstr ($errno)");
        return false;
    }

    $read = function() use ($socket) {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') break;
        }
        return $response;
    };

    $write = function($cmd) use ($socket) {
        fputs($socket, $cmd . "\r\n");
    };

    $read(); // Initial greeting

    $write("EHLO " . ($_SERVER['SERVER_NAME'] ?? 'hearmaxx.ca'));
    $read();

    if ($secure === 'tls') {
        $write("STARTTLS");
        $res = $read();
        if (strpos($res, '220') !== 0) {
            fclose($socket);
            return false;
        }
        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        $write("EHLO " . ($_SERVER['SERVER_NAME'] ?? 'hearmaxx.ca'));
        $read();
    }

    if (!empty($user) && !empty($pass)) {
        $write("AUTH LOGIN");
        $read();
        $write(base64_encode($user));
        $read();
        $write(base64_encode($pass));
        $authRes = $read();
        if (strpos($authRes, '235') !== 0) {
            error_log("Hear Maxx SMTP Auth Failed: $authRes");
            fclose($socket);
            return false;
        }
    }

    $write("MAIL FROM:<$from>");
    $read();

    $write("RCPT TO:<$to>");
    $read();

    $write("DATA");
    $read();

    $fromHeader = '=?UTF-8?B?' . base64_encode($config['from_name']) . '?= <' . $from . '>';
    $data = "From: $fromHeader\r\n";
    $data .= "To: <$to>\r\n";
    if (!empty($replyToEmail)) {
        $replyName = !empty($replyToName) ? '=?UTF-8?B?' . base64_encode($replyToName) . '?= ' : '';
        $data .= "Reply-To: $replyName<$replyToEmail>\r\n";
    }
    $data .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
    $data .= "MIME-Version: 1.0\r\n";
    $data .= "Content-Type: text/html; charset=UTF-8\r\n";
    $data .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $data .= $htmlContent . "\r\n.\r\n";

    $write($data);
    $sendRes = $read();

    $write("QUIT");
    fclose($socket);

    return (strpos($sendRes, '250') === 0);
}

// 6. Generate Emails based on Form Type
if ($formType === 'appointment') {
    // -------------------------------------------------------------
    // EMAIL 1: Sent to Owner / Clinic (Exact Image 1 Design)
    // -------------------------------------------------------------
    $ownerSubject = "Hear Maxx Appointment Request";
    $ownerHtml = '
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hear Maxx Appointment Request</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
          <tr>
            <td style="padding: 40px 36px;">
              <!-- Logo Header -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 28px;">
                    <a href="' . htmlspecialchars($config['site_url']) . '" target="_blank" style="text-decoration: none;">
                      <img src="' . htmlspecialchars($logoUrl) . '" alt="Hear Maxx - Ultimate Hearing Solutions" width="220" style="display: block; width: 220px; max-width: 100%; height: auto; border: 0;" />
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #1e293b; line-height: 1.3;">
                      &#x1F4E9; Hear Maxx Appointment Request
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- Intro Line -->
              <p style="margin: 0 0 22px 0; font-size: 15px; color: #334155; line-height: 1.5;">
                Hey, you have a new appointment request from <strong style="color: #0f172a;">' . htmlspecialchars($fullName) . '</strong>.
              </p>

              <!-- Data List with Emojis -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #334155; line-height: 1.5;">
                    <span style="font-size: 16px; margin-right: 6px;">&#x1F4C5;</span>
                    <strong style="color: #0f172a;">Requested Date:</strong> ' . htmlspecialchars($preferredDate ?: 'Not specified') . '
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #334155; line-height: 1.5;">
                    <span style="font-size: 16px; margin-right: 6px;">&#x23F0;</span>
                    <strong style="color: #0f172a;">Requested Time:</strong> ' . htmlspecialchars($preferredTime ?: 'Not specified') . '
                  </td>
                </tr>
                ' . (!empty($clinic) ? '
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #334155; line-height: 1.5;">
                    <span style="font-size: 16px; margin-right: 6px;">&#x1F3E5;</span>
                    <strong style="color: #0f172a;">Clinic Location:</strong> ' . htmlspecialchars($clinic) . '
                  </td>
                </tr>' : '') . '
                ' . (!empty($serviceType) ? '
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #334155; line-height: 1.5;">
                    <span style="font-size: 16px; margin-right: 6px;">&#x1FA7A;</span>
                    <strong style="color: #0f172a;">Service Requested:</strong> ' . htmlspecialchars($serviceType) . '
                  </td>
                </tr>' : '') . '
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #334155; line-height: 1.5;">
                    <span style="font-size: 16px; margin-right: 6px;">&#x2709;&#xFE0F;</span>
                    <strong style="color: #0f172a;">Email:</strong>
                    <a href="mailto:' . htmlspecialchars($email) . '" style="color: #0284c7; text-decoration: none;">' . htmlspecialchars($email ?: 'Not provided') . '</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #334155; line-height: 1.5;">
                    <span style="font-size: 16px; margin-right: 6px;">&#x1F4DE;</span>
                    <strong style="color: #0f172a;">Phone Number:</strong>
                    <a href="tel:' . htmlspecialchars($phone) . '" style="color: #0f172a; text-decoration: none; font-weight: 500;">' . htmlspecialchars($phone) . '</a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-top: 1px solid #e2e8f0; padding-bottom: 20px;"></td>
                </tr>
              </table>

              <!-- Message from client -->
              <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #334155;">
                <span style="font-size: 15px; margin-right: 4px;">&#x1F4AC;</span> Message from the client:
              </p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; font-size: 14px; color: #475569; line-height: 1.6;">
                ' . (!empty($message) ? nl2br(htmlspecialchars($message)) : '<span style="color: #94a3b8; font-style: italic;">No additional notes provided.</span>') . '
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>';

    // Send email to owner
    sendHearMaxxMail($config['owner_email'], $ownerSubject, $ownerHtml, $email, $fullName, $config);

    // -------------------------------------------------------------
    // EMAIL 2: Sent to Person Who Placed Appointment (Exact Image 2 Design)
    // -------------------------------------------------------------
    if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $clientSubject = "We've Received Your Appointment Request – Hear Maxx";
        $clientHtml = '
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We\'ve Received Your Appointment Request – Hear Maxx</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
          <tr>
            <td style="padding: 40px 36px;">
              <!-- Logo Header -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 28px;">
                    <a href="' . htmlspecialchars($config['site_url']) . '" target="_blank" style="text-decoration: none;">
                      <img src="' . htmlspecialchars($logoUrl) . '" alt="Hear Maxx - Ultimate Hearing Solutions" width="220" style="display: block; width: 220px; max-width: 100%; height: auto; border: 0;" />
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Heading with Checkmark -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #1e293b; line-height: 1.3;">
                      <span style="color: #16a34a; margin-right: 6px;">&#x2705;</span> Appointment Submitted Successfully
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- Greeting & Reassurance -->
              <p style="margin: 0 0 12px 0; font-size: 15px; color: #334155; line-height: 1.5;">
                Hi <strong style="color: #0f172a;">' . htmlspecialchars($fullName) . '</strong>, thank you for requesting an appointment with <strong style="color: #0f172a;">Hear Maxx</strong>.
              </p>
              <p style="margin: 0 0 22px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                We\'ve received your request and one of our team members will contact you shortly to confirm your appointment.
              </p>

              <!-- Appointment Details -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #334155; line-height: 1.5;">
                    <span style="font-size: 16px; margin-right: 6px;">&#x1F4C5;</span>
                    <strong style="color: #0f172a;">Requested Date:</strong> ' . htmlspecialchars($preferredDate ?: 'To be confirmed') . '
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #334155; line-height: 1.5;">
                    <span style="font-size: 16px; margin-right: 6px;">&#x23F0;</span>
                    <strong style="color: #0f172a;">Requested Time:</strong> ' . htmlspecialchars($preferredTime ?: 'To be confirmed') . '
                  </td>
                </tr>
                ' . (!empty($clinic) ? '
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #334155; line-height: 1.5;">
                    <span style="font-size: 16px; margin-right: 6px;">&#x1F3E5;</span>
                    <strong style="color: #0f172a;">Clinic Location:</strong> ' . htmlspecialchars($clinic) . '
                  </td>
                </tr>' : '') . '
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #334155; line-height: 1.5;">
                    <span style="font-size: 16px; margin-right: 6px;">&#x2709;&#xFE0F;</span>
                    <strong style="color: #0f172a;">Your Email:</strong>
                    <span style="color: #0284c7;">' . htmlspecialchars($email) . '</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #334155; line-height: 1.5;">
                    <span style="font-size: 16px; margin-right: 6px;">&#x1F4DE;</span>
                    <strong style="color: #0f172a;">Your Phone Number:</strong>
                    <span style="color: #0f172a; font-weight: 500;">' . htmlspecialchars($phone) . '</span>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-top: 1px solid #e2e8f0; padding-bottom: 24px;"></td>
                </tr>
              </table>

              <!-- Footer -->
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
                This is a confirmation email from <a href="' . htmlspecialchars($config['site_url']) . '" target="_blank" style="color: #64748b; text-decoration: underline;">HearMaxx.ca</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>';

        // Send confirmation email to client
        sendHearMaxxMail($email, $clientSubject, $clientHtml, $config['owner_email'], $config['from_name'], $config);
    }
} else {
    // -------------------------------------------------------------
    // CONTACT FORM SUBMISSION
    // -------------------------------------------------------------
    $ownerSubject = "[Hear Maxx] New Contact Inquiry from " . $fullName;
    $ownerHtml = '
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hear Maxx Contact Inquiry</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
          <tr>
            <td style="padding: 40px 36px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <img src="' . htmlspecialchars($logoUrl) . '" alt="Hear Maxx" width="220" style="display: block; margin: 0 auto; max-width: 100%; height: auto;" />
              </div>
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #1e293b; text-align: center;">
                &#x1F4E8; New Contact Message
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155;">
                You received an inquiry from <strong style="color: #0f172a;">' . htmlspecialchars($fullName) . '</strong>:
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; font-size: 14px; color: #334155;">
                <tr><td style="padding: 4px 0;"><strong>Phone:</strong> ' . htmlspecialchars($phone) . '</td></tr>
                <tr><td style="padding: 4px 0;"><strong>Email:</strong> ' . htmlspecialchars($email ?: 'Not provided') . '</td></tr>
                <tr><td style="padding: 4px 0;"><strong>Clinic:</strong> ' . htmlspecialchars($clinic) . '</td></tr>
              </table>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #334155;">Message:</p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; font-size: 14px; color: #475569; line-height: 1.6;">
                ' . nl2br(htmlspecialchars($message)) . '
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>';

    sendHearMaxxMail($config['owner_email'], $ownerSubject, $ownerHtml, $email, $fullName, $config);

    if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $clientSubject = "We've Received Your Message – Hear Maxx";
        $clientHtml = '
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>We\'ve Received Your Message – Hear Maxx</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
          <tr>
            <td style="padding: 40px 36px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <img src="' . htmlspecialchars($logoUrl) . '" alt="Hear Maxx" width="220" style="display: block; margin: 0 auto; max-width: 100%; height: auto;" />
              </div>
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #16a34a; text-align: center;">
                &#x2705; Thank You for Reaching Out
              </h1>
              <p style="margin: 0 0 12px 0; font-size: 15px; color: #334155;">
                Hi <strong style="color: #0f172a;">' . htmlspecialchars($fullName) . '</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                Thank you for contacting Hear Maxx. Our clinical care team has received your message and will get back to you shortly.
              </p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                This is a confirmation email from <a href="' . htmlspecialchars($config['site_url']) . '" target="_blank" style="color: #64748b; text-decoration: underline;">HearMaxx.ca</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>';
        sendHearMaxxMail($email, $clientSubject, $clientHtml, $config['owner_email'], $config['from_name'], $config);
    }
}

// 7. Always log submission locally so no request is ever lost
$logEntry = [
    'timestamp'      => date('Y-m-d H:i:s T'),
    'ip'             => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
    'form_type'      => $formType,
    'full_name'      => $fullName,
    'phone'          => $phone,
    'email'          => $email,
    'clinic'         => $clinic,
    'service_type'   => $serviceType,
    'preferred_date' => $preferredDate,
    'preferred_time' => $preferredTime,
    'message'        => $message
];
@file_put_contents(__DIR__ . '/form-submissions.log', json_encode($logEntry) . "\n", FILE_APPEND | LOCK_EX);

// 8. Respond to Client
$isAjax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
if (!$isAjax && !empty($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') === false) {
    $referer = $_SERVER['HTTP_REFERER'] ?? '/';
    $separator = (strpos($referer, '?') !== false) ? '&' : '?';
    header('Location: ' . $referer . $separator . 'submitted=1');
    exit;
}

$successMsg = ($formType === 'appointment')
    ? 'Thank you! Your appointment request has been received. A confirmation email has been sent to your inbox.'
    : 'Thank you! Your message has been received. Our team will contact you promptly.';

echo json_encode([
    'status'  => 'success',
    'message' => $successMsg
]);
exit;
