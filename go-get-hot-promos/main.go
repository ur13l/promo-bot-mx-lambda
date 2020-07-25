package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/gocolly/colly/v2"
	"github.com/ur13l/promo-bot-mx-lambda/go-get-hot-promos/models"
)

func readSitesFromJSON(path string) ([]models.Site, error) {
	jsonFile, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer jsonFile.Close()
	byteValue, _ := ioutil.ReadAll(jsonFile)
	var sites []models.Site
	json.Unmarshal(byteValue, &sites)
	return sites, nil
}

func main() {
	start := time.Now()
	const siteURL = "https://promodescuentos.com"
	const path = "/grupo/videojuegos"
	const name = "Videojuegos"
	const maxPageDeep = 3
	sites, err := readSitesFromJSON("./sites.json")
	if err != nil {
		panic("Could not find configuration path: " + path)
	}

	collector := colly.NewCollector(
		colly.AllowedDomains("promodescuentos.com", "www.promodescuentos.com"),
		colly.MaxDepth(2),
		colly.Async(),
	)
	collector.Limit(&colly.LimitRule{DomainGlob: "*", Parallelism: 8})

	collector.OnHTML("article", func(e *colly.HTMLElement) {
		degree := e.ChildText(".vote-temp--hot, .vote-temp--burn")
		title := e.ChildText(".thread-title--card")
		link := e.ChildAttr(".thread-title--card", "href")
		fmt.Println("===========================================================")
		fmt.Println("degree: " + degree)
		fmt.Println("title: " + title)
		fmt.Println("link: " + link)
		fmt.Println("===========================================================")
	})

	collector.OnResponse(func(r *colly.Response) {
		fmt.Println("StatusCode: " + string(r.StatusCode))
	})

	collector.OnError(func(r *colly.Response, err error) {
		fmt.Println(err.Error())
	})

	collector.OnRequest(func(r *colly.Request) {
		fmt.Println("Visiting", r.URL.String())
	})
	for _, site := range sites {
		for _, route := range site.Routes {
			for currentPage := 1; currentPage <= maxPageDeep; currentPage++ {
				url := site.URL + route.Path + "?page=" + strconv.Itoa(currentPage)
				fmt.Println(url)
				collector.Visit(url)
			}
		}
	}

	collector.Wait()
	elapsed := time.Since(start)
	log.Printf("Time elapsed %s", elapsed)
}
