package model

import (
	"bytes"
	"database/sql/driver"
	"github.com/gofrs/uuid"
)

type ID struct {
	UUID  uuid.UUID
	Valid bool
}

func NewID() ID {
	return ID{
		UUID:  uuid.Must(uuid.NewV4()),
		Valid: true,
	}
}

func ParseID(id string) ID {
	uuidObj, err := uuid.FromString(id)
	if err != nil {
		return ID{}
	}
	return ID{
		UUID:  uuidObj,
		Valid: true,
	}
}

func (id ID) String() string {
	if !id.Valid {
		return ""
	}
	return id.UUID.String()
}

// Equals checks if the ID is equal to another ID
// Note: This method enforces both IDs to be valid and will return false otherwise
func (id ID) Equals(otherID ID) bool {
	if !id.Valid {
		return false
	}
	if !otherID.Valid {
		return false
	}
	return bytes.Compare(id.UUID.Bytes(), otherID.UUID.Bytes()) == 0
}

// EqualsString checks if the ID is equal to a string
// Note: This method enforces both IDs to be valid and will return false otherwise
func (id ID) EqualsString(otherID string) bool {
	if !id.Valid {
		return false
	}
	if len(otherID) == 0 {
		return false
	}
	otherIDObj, err := uuid.FromString(otherID)
	if err != nil {
		return false
	}
	return bytes.Compare(id.UUID.Bytes(), otherIDObj.Bytes()) == 0
}

func (id ID) Value() (driver.Value, error) {
	if !id.Valid {
		return nil, nil
	}
	// Delegate to UUID Value function
	return id.UUID.Value()
}

func (id *ID) Scan(src interface{}) error {
	if src == nil {
		id.UUID, id.Valid = uuid.Nil, false
		return nil
	}
	// Delegate to UUID Scan function
	id.Valid = true
	return id.UUID.Scan(src)
}

func (id ID) MarshalJSON() ([]byte, error) {
	if !id.Valid {
		return []byte("null"), nil
	}
	var buf [38]byte
	buf[0] = '"'
	encodeCanonical(buf[1:37], id.UUID)
	buf[37] = '"'
	return buf[:], nil
}

func (id *ID) UnmarshalJSON(b []byte) error {
	if string(b) == "null" {
		id.UUID, id.Valid = uuid.Nil, false
		return nil
	}
	if n := len(b); n >= 2 && b[0] == '"' {
		b = b[1 : n-1]
	}
	err := id.UUID.UnmarshalText(b)
	id.Valid = err == nil
	return err
}

// encodeCanonical encodes the canonical RFC-4122 form of UUID u into the first 36 bytes dst
func encodeCanonical(dst []byte, u uuid.UUID) {
	const hextable = "0123456789abcdef"
	dst[8] = '-'
	dst[13] = '-'
	dst[18] = '-'
	dst[23] = '-'
	for i, x := range [16]byte{
		0, 2, 4, 6,
		9, 11,
		14, 16,
		19, 21,
		24, 26, 28, 30, 32, 34,
	} {
		c := u[i]
		dst[x] = hextable[c>>4]
		dst[x+1] = hextable[c&0x0f]
	}
}
