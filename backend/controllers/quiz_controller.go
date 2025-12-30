package controllers

import (
	"BACKEND/config"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ========================================================
// ORGANIZATION - CERTIFICATE SETTINGS
// ========================================================

// GetCertificateSettings - Get certificate settings for an event
func GetCertificateSettings(c *gin.Context) {
	eventID := c.Param("eventID")
	userID := c.GetInt64("user_id")

	// Verify ownership
	if !checkEventOwnedByUserID(mustParseInt64(eventID), userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var settings struct {
		ID               int64   `db:"id" json:"id"`
		EventID          int64   `db:"event_id" json:"event_id"`
		IsEnabled        bool    `db:"is_enabled" json:"is_enabled"`
		MinScorePercent  int     `db:"min_score_percent" json:"min_score_percent"`
		CertificateTitle *string `db:"certificate_title" json:"certificate_title"`
	}

	err := config.DB.Get(&settings, `
		SELECT id, event_id, is_enabled, min_score_percent, certificate_title
		FROM event_certificates WHERE event_id = ?
	`, eventID)

	if err != nil {
		// Return default settings if not exists
		c.JSON(http.StatusOK, gin.H{
			"settings": gin.H{
				"event_id":          eventID,
				"is_enabled":        false,
				"min_score_percent": 80,
				"certificate_title": nil,
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"settings": settings})
}

// UpdateCertificateSettings - Update certificate settings
func UpdateCertificateSettings(c *gin.Context) {
	eventID := c.Param("eventID")
	userID := c.GetInt64("user_id")

	if !checkEventOwnedByUserID(mustParseInt64(eventID), userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var input struct {
		IsEnabled        bool    `json:"is_enabled"`
		MinScorePercent  int     `json:"min_score_percent"`
		CertificateTitle *string `json:"certificate_title"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}

	if input.MinScorePercent < 1 || input.MinScorePercent > 100 {
		input.MinScorePercent = 80
	}

	// Upsert
	_, err := config.DB.Exec(`
		INSERT INTO event_certificates (event_id, is_enabled, min_score_percent, certificate_title)
		VALUES (?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled), 
		                        min_score_percent = VALUES(min_score_percent),
		                        certificate_title = VALUES(certificate_title)
	`, eventID, input.IsEnabled, input.MinScorePercent, input.CertificateTitle)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Settings saved"})
}

// ========================================================
// ORGANIZATION - QUIZ MANAGEMENT
// ========================================================

// GetSessionQuiz - Get quiz for a session
func GetSessionQuiz(c *gin.Context) {
	sessionID := c.Param("sessionID")
	userID := c.GetInt64("user_id")

	// Verify ownership through event
	var eventID int64
	config.DB.Get(&eventID, "SELECT event_id FROM sessions WHERE id = ?", sessionID)
	if !checkEventOwnedByUserID(eventID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var quiz struct {
		ID        int64  `db:"id" json:"id"`
		SessionID int64  `db:"session_id" json:"session_id"`
		Title     string `db:"title" json:"title"`
		IsEnabled bool   `db:"is_enabled" json:"is_enabled"`
	}

	err := config.DB.Get(&quiz, `SELECT id, session_id, title, is_enabled FROM session_quizzes WHERE session_id = ?`, sessionID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"quiz": nil, "questions": []interface{}{}})
		return
	}

	var questions []struct {
		ID            int64   `db:"id" json:"id"`
		QuestionText  string  `db:"question_text" json:"question_text"`
		OptionA       string  `db:"option_a" json:"option_a"`
		OptionB       string  `db:"option_b" json:"option_b"`
		OptionC       *string `db:"option_c" json:"option_c"`
		OptionD       *string `db:"option_d" json:"option_d"`
		CorrectOption string  `db:"correct_option" json:"correct_option"`
		OrderIndex    int     `db:"order_index" json:"order_index"`
	}
	config.DB.Select(&questions, `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option, order_index FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index`, quiz.ID)

	c.JSON(http.StatusOK, gin.H{"quiz": quiz, "questions": questions})
}

// SaveSessionQuiz - Create or update quiz with questions
func SaveSessionQuiz(c *gin.Context) {
	sessionID := c.Param("sessionID")
	userID := c.GetInt64("user_id")

	fmt.Printf("[DEBUG SaveSessionQuiz] sessionID=%s, userID=%d\n", sessionID, userID)

	var eventID int64
	err := config.DB.Get(&eventID, "SELECT event_id FROM sessions WHERE id = ?", sessionID)
	if err != nil {
		fmt.Printf("[DEBUG] Session not found: %v\n", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	fmt.Printf("[DEBUG] eventID=%d, checking ownership\n", eventID)

	if !checkEventOwnedByUserID(eventID, userID) {
		fmt.Printf("[DEBUG] Ownership check failed for eventID=%d, userID=%d\n", eventID, userID)
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied - not owner of this event"})
		return
	}

	var input struct {
		Title     string `json:"title"`
		IsEnabled bool   `json:"is_enabled"`
		Questions []struct {
			QuestionText  string  `json:"question_text"`
			OptionA       string  `json:"option_a"`
			OptionB       string  `json:"option_b"`
			OptionC       *string `json:"option_c"`
			OptionD       *string `json:"option_d"`
			CorrectOption string  `json:"correct_option"`
		} `json:"questions"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}

	if len(input.Questions) > 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Maximum 10 questions allowed"})
		return
	}

	// Upsert quiz
	result, err := config.DB.Exec(`
		INSERT INTO session_quizzes (session_id, title, is_enabled)
		VALUES (?, ?, ?)
		ON DUPLICATE KEY UPDATE title = VALUES(title), is_enabled = VALUES(is_enabled)
	`, sessionID, input.Title, input.IsEnabled)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save quiz"})
		return
	}

	// Get quiz ID
	var quizID int64
	config.DB.Get(&quizID, "SELECT id FROM session_quizzes WHERE session_id = ?", sessionID)
	if quizID == 0 {
		quizID, _ = result.LastInsertId()
	}

	// Delete old questions and insert new
	config.DB.Exec("DELETE FROM quiz_questions WHERE quiz_id = ?", quizID)

	for i, q := range input.Questions {
		config.DB.Exec(`
			INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, order_index)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`, quizID, q.QuestionText, q.OptionA, q.OptionB, q.OptionC, q.OptionD, q.CorrectOption, i+1)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Quiz saved", "quiz_id": quizID})
}

// DeleteSessionQuiz - Delete quiz
func DeleteSessionQuiz(c *gin.Context) {
	sessionID := c.Param("sessionID")
	userID := c.GetInt64("user_id")

	var eventID int64
	config.DB.Get(&eventID, "SELECT event_id FROM sessions WHERE id = ?", sessionID)
	if !checkEventOwnedByUserID(eventID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	config.DB.Exec("DELETE FROM session_quizzes WHERE session_id = ?", sessionID)
	c.JSON(http.StatusOK, gin.H{"message": "Quiz deleted"})
}

// ========================================================
// USER - QUIZ TAKING & PROGRESS
// ========================================================

// GetUserEventProgress - Get user's progress for an event
func GetUserEventProgress(c *gin.Context) {
	eventID := c.Param("eventID")
	userID := c.GetInt64("user_id")

	// Get all quizzes for this event
	var quizzes []struct {
		QuizID      int64  `db:"quiz_id"`
		SessionID   int64  `db:"session_id"`
		SessionName string `db:"session_name"`
	}
	config.DB.Select(&quizzes, `
		SELECT sq.id as quiz_id, s.id as session_id, s.title as session_name
		FROM session_quizzes sq
		JOIN sessions s ON sq.session_id = s.id
		WHERE s.event_id = ? AND sq.is_enabled = 1
	`, eventID)

	if len(quizzes) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"has_quizzes":     false,
			"progress":        []interface{}{},
			"total_percent":   0,
			"can_certificate": false,
		})
		return
	}

	// Get user attempts for each quiz
	weightPerQuiz := 100.0 / float64(len(quizzes))
	var totalScore float64
	var progress []gin.H

	for _, q := range quizzes {
		var attempt struct {
			ScorePercent float64 `db:"score_percent"`
			Passed       bool    `db:"passed"`
		}
		err := config.DB.Get(&attempt, `
			SELECT score_percent, passed FROM quiz_attempts 
			WHERE user_id = ? AND quiz_id = ? 
			ORDER BY score_percent DESC LIMIT 1
		`, userID, q.QuizID)

		contribution := 0.0
		if err == nil {
			contribution = attempt.ScorePercent * weightPerQuiz / 100.0
			totalScore += contribution
		}

		progress = append(progress, gin.H{
			"session_id":   q.SessionID,
			"session_name": q.SessionName,
			"quiz_id":      q.QuizID,
			"score":        attempt.ScorePercent,
			"passed":       attempt.Passed,
			"weight":       weightPerQuiz,
			"contribution": contribution,
			"completed":    err == nil,
		})
	}

	// Check certificate eligibility
	var minScore int
	config.DB.Get(&minScore, "SELECT COALESCE(min_score_percent, 80) FROM event_certificates WHERE event_id = ?", eventID)
	if minScore == 0 {
		minScore = 80
	}

	c.JSON(http.StatusOK, gin.H{
		"has_quizzes":        true,
		"progress":           progress,
		"total_percent":      totalScore,
		"min_score_required": minScore,
		"can_certificate":    totalScore >= float64(minScore),
	})
}

// GetQuizForUser - Get quiz questions (without answers) for user
func GetQuizForUser(c *gin.Context) {
	sessionID := c.Param("sessionID")
	userID := c.GetInt64("user_id")

	// Check if user has purchased this session
	var purchased int
	config.DB.Get(&purchased, "SELECT COUNT(*) FROM purchases WHERE user_id = ? AND session_id = ?", userID, sessionID)
	if purchased == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Please purchase this session first"})
		return
	}

	var quiz struct {
		ID    int64  `db:"id" json:"id"`
		Title string `db:"title" json:"title"`
	}
	err := config.DB.Get(&quiz, "SELECT id, title FROM session_quizzes WHERE session_id = ? AND is_enabled = 1", sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No quiz available"})
		return
	}

	var questions []struct {
		ID           int64   `db:"id" json:"id"`
		QuestionText string  `db:"question_text" json:"question_text"`
		OptionA      string  `db:"option_a" json:"option_a"`
		OptionB      string  `db:"option_b" json:"option_b"`
		OptionC      *string `db:"option_c" json:"option_c"`
		OptionD      *string `db:"option_d" json:"option_d"`
		OrderIndex   int     `db:"order_index" json:"order_index"`
	}
	config.DB.Select(&questions, `
		SELECT id, question_text, option_a, option_b, option_c, option_d, order_index 
		FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index
	`, quiz.ID)

	c.JSON(http.StatusOK, gin.H{"quiz": quiz, "questions": questions})
}

// SubmitQuiz - Submit quiz answers
func SubmitQuiz(c *gin.Context) {
	sessionID := c.Param("sessionID")
	userID := c.GetInt64("user_id")

	fmt.Printf("[DEBUG SubmitQuiz] sessionID=%s, userID=%d\n", sessionID, userID)

	var input struct {
		Answers map[string]string `json:"answers"` // {"question_id": "A/B/C/D"}
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		fmt.Printf("[DEBUG] Invalid data: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}

	fmt.Printf("[DEBUG] Answers received: %v\n", input.Answers)

	// Get quiz
	var quizID int64
	err := config.DB.Get(&quizID, "SELECT id FROM session_quizzes WHERE session_id = ? AND is_enabled = 1", sessionID)
	if err != nil {
		fmt.Printf("[DEBUG] Quiz not found: %v\n", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "No quiz found"})
		return
	}

	fmt.Printf("[DEBUG] quizID=%d\n", quizID)

	// Get correct answers
	var questions []struct {
		ID            int64  `db:"id"`
		CorrectOption string `db:"correct_option"`
	}
	config.DB.Select(&questions, "SELECT id, correct_option FROM quiz_questions WHERE quiz_id = ?", quizID)

	if len(questions) == 0 {
		fmt.Printf("[DEBUG] No questions found for quizID=%d\n", quizID)
		c.JSON(http.StatusBadRequest, gin.H{"error": "No questions in quiz"})
		return
	}

	fmt.Printf("[DEBUG] Found %d questions\n", len(questions))

	// Calculate score
	correct := 0
	for _, q := range questions {
		if answer, ok := input.Answers[fmt.Sprintf("%d", q.ID)]; ok {
			fmt.Printf("[DEBUG] Question %d: user=%s, correct=%s\n", q.ID, answer, q.CorrectOption)
			if answer == q.CorrectOption {
				correct++
			}
		}
	}

	scorePercent := float64(correct) / float64(len(questions)) * 100.0
	passed := scorePercent >= 80 // Default pass threshold

	fmt.Printf("[DEBUG] Score: %.2f%%, Correct: %d/%d, Passed: %v\n", scorePercent, correct, len(questions), passed)

	// Convert answers to proper JSON
	answersJSON, _ := json.Marshal(input.Answers)

	// Save attempt
	result, saveErr := config.DB.Exec(`
		INSERT INTO quiz_attempts (user_id, quiz_id, score_percent, answers, passed)
		VALUES (?, ?, ?, ?, ?)
	`, userID, quizID, scorePercent, string(answersJSON), passed)

	if saveErr != nil {
		fmt.Printf("[DEBUG] Failed to save attempt: %v\n", saveErr)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save quiz attempt"})
		return
	}

	insertedID, _ := result.LastInsertId()
	fmt.Printf("[DEBUG] Quiz attempt saved with ID=%d\n", insertedID)

	c.JSON(http.StatusOK, gin.H{
		"score_percent":   scorePercent,
		"correct_answers": correct,
		"total_questions": len(questions),
		"passed":          passed,
		"message":         fmt.Sprintf("You scored %.0f%% (%d/%d correct)", scorePercent, correct, len(questions)),
	})
}

// ========================================================
// USER - CERTIFICATE
// ========================================================

// GetUserCertificate - Get or generate certificate
func GetUserCertificate(c *gin.Context) {
	eventID := c.Param("eventID")
	userID := c.GetInt64("user_id")

	// Check if certificate already exists
	var cert struct {
		ID              int64   `db:"id" json:"id"`
		TotalScore      float64 `db:"total_score_percent" json:"total_score_percent"`
		CertificateCode string  `db:"certificate_code" json:"certificate_code"`
		IssuedAt        string  `db:"issued_at" json:"issued_at"`
	}
	err := config.DB.Get(&cert, `
		SELECT id, total_score_percent, certificate_code, issued_at 
		FROM user_certificates WHERE user_id = ? AND event_id = ?
	`, userID, eventID)

	if err == nil {
		// Certificate exists, get additional info
		var eventInfo struct {
			EventTitle string `db:"event_title"`
			OrgName    string `db:"org_name"`
		}
		config.DB.Get(&eventInfo, `
			SELECT e.title as event_title, o.name as org_name
			FROM events e JOIN organizations o ON e.organization_id = o.id
			WHERE e.id = ?
		`, eventID)

		var userName string
		config.DB.Get(&userName, "SELECT name FROM users WHERE id = ?", userID)

		c.JSON(http.StatusOK, gin.H{
			"has_certificate": true,
			"certificate":     cert,
			"user_name":       userName,
			"event_title":     eventInfo.EventTitle,
			"org_name":        eventInfo.OrgName,
		})
		return
	}

	// Check eligibility
	var quizzes []struct {
		QuizID int64 `db:"quiz_id"`
	}
	config.DB.Select(&quizzes, `
		SELECT sq.id as quiz_id FROM session_quizzes sq
		JOIN sessions s ON sq.session_id = s.id
		WHERE s.event_id = ? AND sq.is_enabled = 1
	`, eventID)

	if len(quizzes) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No quizzes available for certificate"})
		return
	}

	// Calculate total score
	weightPerQuiz := 100.0 / float64(len(quizzes))
	var totalScore float64

	for _, q := range quizzes {
		var score float64
		config.DB.Get(&score, `
			SELECT COALESCE(MAX(score_percent), 0) FROM quiz_attempts 
			WHERE user_id = ? AND quiz_id = ?
		`, userID, q.QuizID)
		totalScore += score * weightPerQuiz / 100.0
	}

	// Check min score
	var minScore int
	config.DB.Get(&minScore, "SELECT COALESCE(min_score_percent, 80) FROM event_certificates WHERE event_id = ?", eventID)
	if minScore == 0 {
		minScore = 80
	}

	if totalScore < float64(minScore) {
		c.JSON(http.StatusOK, gin.H{
			"has_certificate": false,
			"total_score":     totalScore,
			"min_required":    minScore,
			"message":         fmt.Sprintf("You need %.0f%% to get certificate, current: %.2f%%", float64(minScore), totalScore),
		})
		return
	}

	// Generate certificate
	certCode := generateCertCode()
	config.DB.Exec(`
		INSERT INTO user_certificates (user_id, event_id, total_score_percent, certificate_code)
		VALUES (?, ?, ?, ?)
	`, userID, eventID, totalScore, certCode)

	// Get info for response
	var eventInfo struct {
		EventTitle string `db:"event_title"`
		OrgName    string `db:"org_name"`
	}
	config.DB.Get(&eventInfo, `
		SELECT e.title as event_title, o.name as org_name
		FROM events e JOIN organizations o ON e.organization_id = o.id
		WHERE e.id = ?
	`, eventID)

	var userName string
	config.DB.Get(&userName, "SELECT name FROM users WHERE id = ?", userID)

	c.JSON(http.StatusOK, gin.H{
		"has_certificate": true,
		"certificate": gin.H{
			"total_score_percent": totalScore,
			"certificate_code":    certCode,
			"issued_at":           "just now",
		},
		"user_name":   userName,
		"event_title": eventInfo.EventTitle,
		"org_name":    eventInfo.OrgName,
	})
}

// Helper functions
func mustParseInt64(s string) int64 {
	v, _ := strconv.ParseInt(s, 10, 64)
	return v
}

func generateCertCode() string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return "CERT-" + hex.EncodeToString(bytes)
}
