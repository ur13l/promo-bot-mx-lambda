package models

//Promo
type Promo struct {
	Degree string `json:"degree"`
	Title  string `json:"title"`
	Link   string `json:"link"`
}

//Site Route
type SiteRoute struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

//Site
type Site struct {
	Name   string      `json:"name"`
	URL    string      `json:"url"`
	Routes []SiteRoute `json:"routes"`
}
