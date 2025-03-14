package api

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/cronny/models"
)

// GoogleAuthRequest represents the ID token from Google
type GoogleAuthRequest struct {
	IDToken string `json:"id_token" binding:"required"`
}

// GoogleUserInfo represents user info from Google
type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
	Locale        string `json:"locale"`
}

// GoogleLoginHandler handles Google OAuth login
func GoogleLoginHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req GoogleAuthRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Verify the ID token with Google
		googleUser, err := verifyGoogleToken(req.IDToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Google token"})
			return
		}

		// Check if user exists by Google ID
		var user models.User
		result := db.Where("google_id = ?", googleUser.ID).First(&user)

		if result.Error != nil {
			// User not found by GoogleID, try finding by email
			result = db.Where("email = ?", googleUser.Email).First(&user)

			if result.Error != nil {
				// User doesn't exist, create a new one
				user = models.User{
					Username:  googleUser.Name,
					Email:     googleUser.Email,
					GoogleID:  &googleUser.ID,
					AvatarURL: googleUser.Picture,
				}

				if err := db.Create(&user).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
					return
				}
			} else {
				// User found by email, update Google ID
				user.GoogleID = &googleUser.ID
				user.AvatarURL = googleUser.Picture
				if err := db.Save(&user).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
					return
				}
			}
		} else {
			// User found by GoogleID, update details if needed
			if user.AvatarURL != googleUser.Picture {
				user.AvatarURL = googleUser.Picture
				if err := db.Save(&user).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
					return
				}
			}
		}

		// Generate token
		token, err := generateToken(user.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"token": token,
			"user": gin.H{
				"id":         user.ID,
				"username":   user.Username,
				"email":      user.Email,
				"avatar_url": user.AvatarURL,
			},
		})
	}
}

// verifyGoogleToken validates the ID token and returns the Google user info
func verifyGoogleToken(idToken string) (*GoogleUserInfo, error) {
	// Verify token with Google
	url := fmt.Sprintf("https://oauth2.googleapis.com/tokeninfo?id_token=%s", idToken)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("invalid token")
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var userInfo GoogleUserInfo
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return nil, err
	}

	return &userInfo, nil
}
