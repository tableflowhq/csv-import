package file

import (
	"container/heap"
	"strings"
	"tableflow/go/pkg/model"
)

// A MatchScore holds the template column ID and the similarity score
type MatchScore struct {
	templateColumnID model.ID
	score            float32
	index            int // The index is needed by the heap.Interface methods
}

// A PriorityMatchQueue implements heap.Interface and holds MatchScore items
type PriorityMatchQueue []*MatchScore

func (pq PriorityMatchQueue) Len() int { return len(pq) }

func (pq PriorityMatchQueue) Less(i, j int) bool {
	// We want Pop to give us the highest, not lowest, score, so we use greater than here
	return pq[i].score > pq[j].score
}

func (pq PriorityMatchQueue) Swap(i, j int) {
	pq[i], pq[j] = pq[j], pq[i]
	pq[i].index = i
	pq[j].index = j
}

func (pq *PriorityMatchQueue) Push(x interface{}) {
	n := len(*pq)
	item := x.(*MatchScore)
	item.index = n
	*pq = append(*pq, item)
}

func (pq *PriorityMatchQueue) Pop() interface{} {
	old := *pq
	n := len(old)
	item := old[n-1]
	item.index = -1 // safety first
	*pq = old[0 : n-1]
	return item
}

// update modifies the priority and value of a MatchScore in the queue
func (pq *PriorityMatchQueue) update(item *MatchScore, score float32) {
	item.score = score
	heap.Fix(pq, item.index)
}

// updateMatchScore adds or updates a match score in the priority queue
func updateMatchScore(pq *PriorityMatchQueue, match *MatchScore) {
	// Check if this templateColumnID is already in the queue
	for _, m := range *pq {
		if m.templateColumnID == match.templateColumnID {
			if match.score > m.score {
				pq.update(m, match.score)
			}
			return
		}
	}
	// If not, push it to the queue
	heap.Push(pq, match)
}

// Helper function to add a match to the priority queue based on column names
func addMatchToQueueByName(pq *PriorityMatchQueue, templateColumnName string, templateColumns []*model.TemplateColumn, score float32) {
	// Find the template column ID by name
	for _, tc := range templateColumns {
		if strings.ToLower(strings.TrimSpace(tc.Name)) == strings.ToLower(templateColumnName) {
			heap.Push(pq, &MatchScore{
				templateColumnID: tc.ID,
				score:            score,
			})
			break
		}
	}
}
