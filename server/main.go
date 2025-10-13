package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

type Media struct {
	Kind string `json:"kind"` // "video", "image", "hls", etc.
	// Href   string   `json:"href,omitempty"`   // link wrapping the media (e.g. <a href="...">)
	Srcs []string `json:"srcs,omitempty"` // one or more source URLs (video sources, image src)
	// Poster string   `json:"poster,omitempty"` // poster attribute for video
}

type Post struct {
	ID            string  `json:"id,omitempty"`
	Subreddit     string  `json:"subreddit,omitempty"`
	SubredditHref string  `json:"subreddit_href,omitempty"`
	Author        string  `json:"author,omitempty"`
	AuthorHref    string  `json:"author_href,omitempty"`
	Title         string  `json:"title,omitempty"`
	TitleHref     string  `json:"title_href,omitempty"`
	Media         []Media `json:"media,omitempty"`
	Next          string  `json:"next,omitempty"`
	Prev          string  `json:"prev,omitempty"`
}

type PageLinks struct {
	Next string `json:"next,omitempty"`
	Prev string `json:"prev,omitempty"`
}

func transformMediaURL(redlibURL string) string {
	redlibURL = strings.TrimSpace(redlibURL)
	if redlibURL == "" {
		return ""
	}

	// Pattern 1: /preview/pre/{id}.{ext}?format=... -> https://i.redd.it/{id}.{original_ext}
	previewRe := regexp.MustCompile(`^/preview/pre/([^/?]+\.[^/?]+)`)
	if matches := previewRe.FindStringSubmatch(redlibURL); len(matches) > 1 {
		filename := matches[1]
		// Remove query parameters by splitting on '?'
		if idx := strings.Index(filename, "?"); idx != -1 {
			filename = filename[:idx]
		}
		return "https://i.redd.it/" + filename
	}

	// Pattern 2: /img/{id}.{ext} -> https://i.redd.it/{id}.{ext}
	imgRe := regexp.MustCompile(`^/img/([^/?]+)`)
	if matches := imgRe.FindStringSubmatch(redlibURL); len(matches) > 1 {
		filename := matches[1]
		return "https://i.redd.it/" + filename
	}

	// Pattern 3: /hls/{id}/HLSPlaylist.m3u8 -> https://v.redd.it/{id}/HLSPlaylist.m3u8
	hlsRe := regexp.MustCompile(`^/hls/([^/]+)/(.+)`)
	if matches := hlsRe.FindStringSubmatch(redlibURL); len(matches) > 2 {
		videoID := matches[1]
		path := matches[2]
		return "https://v.redd.it/" + videoID + "/" + path
	}

	return redlibURL
}

func resolveAbs(base *url.URL, ref string) string {
	ref = strings.TrimSpace(ref)
	if ref == "" {
		return ""
	}

	if strings.HasPrefix(ref, "/preview/pre/") ||
		strings.HasPrefix(ref, "/img/") ||
		strings.HasPrefix(ref, "/hls/") {
		return transformMediaURL(ref)
	}

	u, err := url.Parse(ref)
	if err != nil {
		return ref
	}
	return base.ResolveReference(u).String()
}

func main() {
	cookie := "front_page=default; post_sort=new; blur_spoiler=off; show_nsfw=on; blur_nsfw=off; use_hls=on; autoplay_videos=off; hide_awards=on; video_quality=best"
	base_url := "http://localhost:8080"
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		if strings.HasSuffix(r.URL.Path, ".css") || strings.HasSuffix(r.URL.Path, ".js") {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}

		fetch_url := base_url + r.URL.Path
		if r.URL.RawQuery != "" {
			fetch_url += "?" + r.URL.RawQuery
		}

		log.Printf("=== New Request: %s ===\n", fetch_url)
		req, err := http.NewRequest("GET", fetch_url, nil)
		if err != nil {
			log.Fatal(err)
		}
		req.Header.Set("Cookie", cookie)

		client := &http.Client{}
		res, err := client.Do(req)
		if err != nil {
			http.Error(w, "Failed to fetch URL: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer res.Body.Close()

		doc, err := goquery.NewDocumentFromReader(res.Body)
		if err != nil {
			http.Error(w, "Failed to parse HTML: "+err.Error(), http.StatusInternalServerError)
			return
		}

		base, err := url.Parse(base_url)
		if err != nil {
			http.Error(w, "bad base url: "+err.Error(), http.StatusInternalServerError)
			return
		}
		var posts []Post

		doc.Find(".post").Each(func(i int, s *goquery.Selection) {
			var p Post

			s.Find(".post_media_content").Each(func(_ int, m *goquery.Selection) {
				// case: video element(s)
				m.Find("video").Each(func(_ int, v *goquery.Selection) {
					var media Media
					media.Kind = "video"
					// if poster, ok := v.Attr("poster"); ok {
					// 	media.Poster = resolveAbs(base, poster)
					// }
					if vs, ok := v.Attr("src"); ok && strings.TrimSpace(vs) != "" {
						if strings.Contains(vs, ".gif") && !strings.Contains(vs, "/external-pre/") {
							media.Kind = "image"
						}

						media.Srcs = append(media.Srcs, resolveAbs(base, vs))
					}
					v.Find("source").Each(func(_ int, src *goquery.Selection) {
						if ssrc, ok := src.Attr("src"); ok && strings.TrimSpace(ssrc) != "" {
							if strings.Contains(ssrc, ".gif") && !strings.Contains(ssrc, "/external-pre/") {
								media.Kind = "image"
							}
							media.Srcs = append(media.Srcs, resolveAbs(base, ssrc))
						}
					})
					// if a := v.Find("a"); a.Length() > 0 {
					// 	if ah, ok := a.Attr("href"); ok {
					// 		media.Href = resolveAbs(base, ah)
					// 	}
					// }
					// dedupe srcs
					seen := map[string]bool{}
					uniq := []string{}
					for _, u := range media.Srcs {
						if u == "" || seen[u] {
							continue
						}
						seen[u] = true
						uniq = append(uniq, u)
					}
					media.Srcs = uniq
					p.Media = append(p.Media, media)
				})

				// case: image wrapped in anchor <a class="post_media_image">
				m.Find("a.post_media_image").Each(func(_ int, a *goquery.Selection) {
					var media Media
					media.Kind = "image"
					// if ah, ok := a.Attr("href"); ok {
					// 	media.Href = resolveAbs(base, ah)
					// }
					// svg image element: <svg> <image href="...">
					if imgHref, ok := a.Find("svg image").Attr("href"); ok && strings.TrimSpace(imgHref) != "" {
						media.Srcs = append(media.Srcs, resolveAbs(base, imgHref))
					}
					// fallback desc > img src
					if imgSrc, ok := a.Find("desc img").Attr("src"); ok && strings.TrimSpace(imgSrc) != "" {
						media.Srcs = append(media.Srcs, resolveAbs(base, imgSrc))
					}
					// also look for any img inside
					if imgSrc2, ok := a.Find("img").Attr("src"); ok && strings.TrimSpace(imgSrc2) != "" {
						media.Srcs = append(media.Srcs, resolveAbs(base, imgSrc2))
					}

					// dedupe and append if any srcs found
					seen := map[string]bool{}
					uniq := []string{}
					for _, u := range media.Srcs {
						if u == "" || seen[u] {
							continue
						}
						seen[u] = true
						uniq = append(uniq, u)
					}
					media.Srcs = uniq
					if len(media.Srcs) > 0 {
						p.Media = append(p.Media, media)
					}
				})
			})

			thumb := s.Find("a.post_thumbnail")
			if thumb.Length() > 0 && strings.TrimSpace(thumb.Find("span").Text()) == "gallery" {
				galleryHref, ok := thumb.Attr("href")
				if !ok {
					// No gallery href, skip
					return
				}
				galleryURL := base_url + galleryHref

				req, err := http.NewRequest("GET", galleryURL, nil)
				if err != nil {
					return
				}
				req.Header.Set("Cookie", cookie) // <-- set the cookie here

				client := &http.Client{}
				resp, err := client.Do(req)
				if err != nil {
					return
				}
				defer resp.Body.Close()

				galleryDoc, err := goquery.NewDocumentFromReader(resp.Body)
				if err != nil {
					return
				}

				galleryDoc.Find("div.gallery figure img").Each(func(i int, a *goquery.Selection) {
					if href, ok := a.Attr("src"); ok {
						mediaURL := resolveAbs(base, href)
						p.Media = append(p.Media, Media{
							Kind: "image", // or "gif" if you want to check extension
							Srcs: []string{mediaURL},
						})
					}
				})
			}

			if len(p.Media) == 0 {
				return
			}

			if id, ok := s.Attr("id"); ok {
				p.ID = id
			}

			// subreddit (text + href)
			if sub := s.Find(".post_subreddit"); sub.Length() > 0 {
				p.Subreddit = strings.TrimSpace(sub.Text())
				if href, ok := sub.Attr("href"); ok {
					p.SubredditHref = href
				}
			}

			// author
			if au := s.Find(".post_author"); au.Length() > 0 {
				p.Author = strings.TrimSpace(au.Text())
				if href, ok := au.Attr("href"); ok {
					p.AuthorHref = href + "/submitted"
				}
			}

			// title: choose the title link but skip the flair link (.post_flair)
			titleSel := s.Find("h2.post_title")
			if titleSel.Length() > 0 {
				// choose first anchor that is not .post_flair
				titleA := titleSel.Find("a").Not(".post_flair").First()
				p.Title = strings.TrimSpace(titleA.Text())
				if href, ok := titleA.Attr("href"); ok {
					p.TitleHref = href
				}
			}

			posts = append(posts, p)
		})

		var page PageLinks
		doc.Find("main footer a").Each(func(_ int, a *goquery.Selection) {
			if key, ok := a.Attr("accesskey"); ok {
				href, _ := a.Attr("href")
				vals, err := url.ParseQuery(strings.TrimPrefix(href, "?"))
				if err != nil {
					return
				}
				switch key {
				case "N":
					page.Next = vals.Get("after")
				case "P":
					page.Prev = vals.Get("before")
				}
			}
		})

		response := struct {
			Posts     []Post    `json:"posts"`
			PageLinks PageLinks `json:"page_links"`
		}{
			Posts:     posts,
			PageLinks: page,
		}

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		if err := json.NewEncoder(w).Encode(response); err != nil {
			log.Printf("encode error: %v", err)
		}
	})

	fmt.Println("Server is running on port 8081")
	log.Fatal(http.ListenAndServe(":8081", nil))
}
