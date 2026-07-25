<?php
/**
 * REST API Gateway for KuruMaster MySQL Application
 * Provides endpoints for Students, Teachers, Questions, Subjects, Assignments, Exam Results
 */
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$input = json_decode(file_get_contents('php_input://input') ?: '{}', true);

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    switch ($action) {
        case 'fetch_app_data':
            $students = $pdo->query("SELECT * FROM students WHERE status IN ('active', 'suspended')")->fetchAll();
            $questions = $pdo->query("SELECT * FROM questions")->fetchAll();
            $results = $pdo->query("SELECT * FROM exam_results ORDER BY timestamp DESC")->fetchAll();
            $assignments = $pdo->query("SELECT * FROM assignments")->fetchAll();
            $subjects = $pdo->query("SELECT * FROM subjects")->fetchAll();
            jsonResponse([
                'students' => $students,
                'questions' => $questions,
                'results' => $results,
                'assignments' => $assignments,
                'subjects' => $subjects
            ]);
            break;

        case 'verify_student_login':
            $username = $input['username'] ?? '';
            $password = $input['password'] ?? '';
            $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
            $stmt->execute([$username]);
            $student = $stmt->fetch();
            if (!$student) jsonResponse(['error' => "ไม่พบข้อมูลผู้ใช้งาน $username"], 404);
            if ($student['status'] === 'pending') jsonResponse(['error' => 'บัญชีของคุณกำลังรอการอนุมัติจากเจ้าหน้าที่'], 403);
            if ($student['status'] === 'suspended') jsonResponse(['error' => 'บัญชีของคุณถูกระงับการใช้งานชั่วคราว'], 403);
            if ($student['password'] !== $password) jsonResponse(['error' => 'รหัสผ่านไม่ถูกต้อง'], 401);

            $update = $pdo->prepare("UPDATE students SET login_count = login_count + 1, last_login = ? WHERE id = ?");
            $update->execute([round(microtime(true) * 1000), $username]);
            jsonResponse(['student' => $student]);
            break;

        case 'verify_teacher_login':
            $username = $input['username'] ?? '';
            $password = $input['password'] ?? '';
            $stmt = $pdo->prepare("SELECT * FROM teachers WHERE username = ? AND password = ?");
            $stmt->execute([$username, $password]);
            $teacher = $stmt->fetch();
            if (!$teacher) jsonResponse(['success' => false, 'message' => 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง']);
            
            $update = $pdo->prepare("UPDATE teachers SET login_count = login_count + 1, last_login = ? WHERE id = ?");
            $update->execute([round(microtime(true) * 1000), $teacher['id']]);
            jsonResponse(['success' => true, 'teacher' => $teacher]);
            break;

        case 'save_score':
            $stmt = $pdo->prepare("INSERT INTO exam_results (id, student_id, student_name, school, score, total_questions, subject, assignment_id, category, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $id = 'res-' . round(microtime(true) * 1000);
            $stmt->execute([
                $id,
                $input['student_id'],
                $input['student_name'] ?? '',
                $input['school'] ?? '',
                $input['score'] ?? 0,
                $input['total'] ?? 0,
                $input['subject'] ?? 'ทั่วไป',
                $input['assignment_id'] ?? null,
                $input['category'] ?? 'GENERAL',
                round(microtime(true) * 1000)
            ]);
            
            if (!empty($input['earnedStars']) && ($input['category'] ?? '') !== 'EXAM') {
                $upStars = $pdo->prepare("UPDATE students SET stars = stars + ? WHERE id = ?");
                $upStars->execute([$input['earnedStars'], $input['student_id']]);
            }
            jsonResponse(['success' => true]);
            break;

        case 'request_registration':
            $stmt = $pdo->prepare("INSERT INTO registration_requests (id, citizen_id, name, surname, major, exam_type, school_id, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
            $id = 'req-' . round(microtime(true) * 1000);
            $stmt->execute([
                $id,
                $input['citizen_id'],
                $input['name'],
                $input['surname'],
                $input['major'] ?? '',
                $input['exam_type'] ?? 'TEACHER',
                $input['school_id'] ?? '00000000-0000-0000-0000-000000000000',
                round(microtime(true) * 1000)
            ]);
            jsonResponse(['success' => true, 'message' => 'ส่งคำขอลงทะเบียนเรียบร้อยแล้ว']);
            break;

        default:
            jsonResponse(['message' => 'API Endpoint Active for KuruMaster MySQL (Windows/phpMyAdmin)'], 200);
            break;
    }
} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
