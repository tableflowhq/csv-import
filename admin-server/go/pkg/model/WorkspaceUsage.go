package model

type WorkspaceUsage struct {
	WorkspaceID        string  `json:"workspace_id" example:"b2079476-261a-41fe-8019-46eb51c537f7"`
	Month              string  `json:"month" example:"2023-06-01"`
	NumFiles           int64   `json:"num_files" example:"10000"`
	NumRows            int64   `json:"num_rows" example:"10000"`
	NumProcessedValues int64   `json:"num_processed_values" example:"10000"`
	TotalFileSizeMB    float64 `json:"total_file_size_mb" example:"10000"`
}
