package util

import (
	"encoding/json"
	"errors"
	"math/big"
)

type BigInt struct {
	*big.Int
}

type BigFloat struct {
	*big.Float
}

// StringToBigInt Attempt to convert a string to a BigInt
func StringToBigInt(s string) (BigInt, bool) {
	if bi, ok := new(big.Int).SetString(s, 10); ok {
		return BigInt{bi}, true
	}
	return BigInt{}, false
}

func (i BigInt) String() string {
	if i.Int == nil {
		return "null"
	}
	return i.Text(10)
}

func (i BigInt) MarshalJSON() ([]byte, error) {
	if i.Int == nil {
		return json.Marshal(nil)
	}
	return []byte(i.String()), nil
}

func (i *BigInt) UnmarshalJSON(data []byte) error {
	if i.Int == nil {
		i.Int = new(big.Int)
	}
	s := string(data)
	if s == "null" || len(s) == 0 {
		i.Int = nil
		return nil
	}
	bi, ok := StringToBigInt(s)
	if !ok {
		return errors.New("invalid number format")
	}
	i.Int = bi.Int
	return nil
}

// StringToBigFloat Attempt to convert a string to a BigFloat
func StringToBigFloat(s string) (BigFloat, bool) {
	flt := new(big.Float).SetPrec(256)
	if _, ok := flt.SetString(s); ok {
		// Round the number to fit within 256 bits of precision
		flt.SetMode(big.ToNearestEven)
		flt.SetPrec(256)
		return BigFloat{flt}, true
	}
	return BigFloat{}, false
}

func (f BigFloat) String() string {
	if f.Float == nil {
		return "null"
	}
	// Use -1 for maximum precision up to the limit
	return f.Text('f', -1)
}

func (f BigFloat) MarshalJSON() ([]byte, error) {
	if f.Float == nil {
		return json.Marshal(nil)
	}
	return []byte(f.String()), nil
}

func (f *BigFloat) UnmarshalJSON(data []byte) error {
	if f.Float == nil {
		f.Float = new(big.Float)
	}
	s := string(data)
	if s == "null" || len(s) == 0 {
		f.Float = nil
		return nil
	}
	bf, ok := StringToBigFloat(s)
	if !ok {
		return errors.New("invalid number format")
	}
	f.Float = bf.Float
	return nil
}
