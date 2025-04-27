package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"

	"github.com/gin-gonic/gin"
)

const JAVASCRIPT string = "javascript"
const PYTHON string = "python"

type Body struct {
	Code string `json:"code"`
}

type JsonResult struct {
	Title   string `json:"title"`
	Status  string `json:"status"`
	Failure string `json:"failure"`
}

func check(e error) {
	if e != nil {
		panic(e)
	}
}

func copy(srcPath, dstPath string) (err error) {
	r, err := os.Open(srcPath)
	if err != nil {
		log.Printf("Error to open tests file")
	}
	defer r.Close()

	w, err := os.Create(dstPath)
	if err != nil {
		log.Printf("Error to create tests file")
	}

	defer func() {
		if c := w.Close(); err == nil {
			err = c
		}
	}()

	_, err = io.Copy(w, r)
	return err
}

func main() {
	router := gin.Default()

	router.POST("/questions/:id/process", func(ctx *gin.Context) {
		questionId := ctx.Param("id")
		lang := ctx.DefaultQuery("lang", JAVASCRIPT)

		body, err := io.ReadAll(ctx.Request.Body)
		if err != nil {
			fmt.Printf("server: could not read request body: %s\n", err)
		}
		//fmt.Printf("server: request body -> %s\n", body)

		if questionId == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"error": "questionId is empty",
			})
			return
		}

		if lang == JAVASCRIPT {
			/* Get current directory */
			currDir, err := os.Getwd()
			if err != nil {
				fmt.Printf("Error getting current directory\n")
			}
			//fmt.Printf("Current directory location -> %s\n", currDir)

			/* Creates temp directory */
			path, err := os.MkdirTemp(currDir, "tmp_")
			check(err)
			//fmt.Printf("Temp dir location -> %s\n", path)

			/* Copy spec file to temp directory*/
			srcPathTestFile := currDir + "/" + "tests/main.spec.js"
			r, err := os.Open(srcPathTestFile)
			if err != nil {
				log.Printf("Error to open tests file")
			}
			defer r.Close()

			w, err := os.Create(path + "/" + "main.spec.js")
			if err != nil {
				log.Printf("Error to create tests file")
			}

			defer func() {
				if c := w.Close(); err == nil {
					err = c
				}
			}()

			_, err = io.Copy(w, r)
			if err != nil {
				log.Printf("error to copy main.spec.js file content to tmp dir")
			}

			/* Copy package.json file to temp directory(necessary for jest) */
			err = copy(currDir+"/tests/package.json", path+"/package.json")
			if err != nil {
				log.Printf("Failed to copy package.json to tmp directory.")
			}

			/* Creates the actual code file */
			tmpFilePath := path + "/" + "main.js"
			//err = os.WriteFile(tmpFilePath, []byte(requestBody.Code), 0755)
			err = os.WriteFile(tmpFilePath, body, 0755)
			check(err)

			/* Attempts to run tests suit */
			cmd := exec.Command("npx", "jest", "main.spec.js", "--json", "--outputFile", "out.json")
			cmd.Dir = path // Set working directory

			// Run command
			if err := cmd.Run(); err != nil {
				fmt.Println("Error running Jest:", err)
			}

			/* Attempt to parse json results */
			cmdStr := "jq -r '[.testResults | .[].assertionResults[] | {title: .title, status: .status, failure: (.failureDetails? // [] | .[].matcherResult?.message // null)}]' out.json"

			// Execute the command
			cmd = exec.Command("bash", "-c", cmdStr)
			cmd.Dir = path

			output, err := cmd.CombinedOutput()
			if err != nil {
				log.Fatalf("Error executing command: %v", err)
			}

			var data []JsonResult

			err = json.Unmarshal(output, &data)
			if err != nil {
				fmt.Printf("could not unmarshal json output\n")
			}

			/* Remove the temp directory */
			cmdStr = "rm -rf " + path

			cmd = exec.Command("bash", "-c", cmdStr)
			cmd.Dir = path

			if err := cmd.Run(); err != nil {
				fmt.Println("Error to remove tmp directory: ", err)
			}

			ctx.JSON(200, gin.H{
				"message": data,
			})
		}

		if lang == PYTHON {
			/* Get current directory */
			currDir, err := os.Getwd()
			if err != nil {
				log.Fatalf("Error getting current directory\n")
			}

			/* Creates temp directory */
			path, err := os.MkdirTemp(currDir, "tmp_")
			check(err)

			/* Copy spec file to temp directory*/
			srcPathTestFile := currDir + "/" + "tests/python/test_main.py"
			r, err := os.Open(srcPathTestFile)
			if err != nil {
				log.Fatalf("Error to open tests file.\n")
			}
			defer r.Close()

			w, err := os.Create(path + "/" + "test_main.py")
			if err != nil {
				log.Fatalf("Error to create tests file.\n")
			}

			defer func() {
				if c := w.Close(); err == nil {
					err = c
				}
			}()

			_, err = io.Copy(w, r)
			if err != nil {
				log.Fatalf("error to copy test_main.py file content to tmp dir.\n")
			}

			/* Copy json_test_runner.py file to temp directory */
			err = copy(currDir+"/tests/python/json_test_runner.py",
				path+"/json_test_runner.py")
			if err != nil {
				log.Fatalln("Failed to copy json_test_runner.py to tmp directory.")
			}

			/* Creates the actual code file */
			tmpFilePath := path + "/" + "main.py"
			//err = os.WriteFile(tmpFilePath, []byte(requestBody.Code), 0755)
			err = os.WriteFile(tmpFilePath, body, 0755)
			check(err)

			/* Attempts to run tests suit */
			cmd := exec.Command("python", "test_main.py")
			cmd.Dir = path // Set working directory

			// Run command
			if err := cmd.Run(); err != nil {
				log.Fatalln("Error running unittest: ", err)
			}

			/* Attempt to parse json results */
			cmdStr := "cat test_report.json | jq"

			/* Execute the command */
			cmd = exec.Command("bash", "-c", cmdStr)
			cmd.Dir = path

			output, err := cmd.CombinedOutput()
			if err != nil {
				log.Fatalf("Error executing command: %v.\n", err)
			}

			var data []JsonResult

			err = json.Unmarshal(output, &data)
			if err != nil {
				log.Fatalf("could not unmarshal json output.\n")
			}

			/* Remove the temp directory */
			cmdStr = "rm -rf " + path

			cmd = exec.Command("bash", "-c", cmdStr)
			cmd.Dir = path

			if err := cmd.Run(); err != nil {
				log.Fatal("Error to remove tmp directory: ", err)
			}

			ctx.JSON(200, gin.H{
				"message": data,
			})
		}
	})

	router.Run("localhost:4001")
}
