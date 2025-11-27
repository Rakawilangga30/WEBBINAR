package models

type User struct {
	ID           int64  `db:"id"`
	Name         string `db:"name"`
	Email        string `db:"email"`
	PasswordHash string `db:"password_hash"`

	Phone       string `db:"phone"`
	ProfileImg  string `db:"profile_img"`
	Bio         string `db:"bio"`
}

