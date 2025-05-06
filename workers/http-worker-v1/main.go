package main

import (
	"bufio"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"

	"github.com/gin-gonic/gin"
)

const JAVASCRIPT string = "javascript"
const PYTHON string = "python"
const JAVA string = "java"

type Body struct {
	Code string `json:"code"`
}

type JsonResult struct {
	Title   string `json:"title"`
	Status  string `json:"status"`
	Failure string `json:"failure"`
}

type TestSuite struct {
	XMLName   xml.Name   `xml:"testsuite"`
	Name      string     `xml:"name,attr"`
	Tests     int        `xml:"tests,attr"`
	Skipped   int        `xml:"skipped,attr"`
	Failures  int        `xml:"failures,attr"`
	Errors    int        `xml:"errors,attr"`
	Time      float64    `xml:"time,attr"`
	Hostname  string     `xml:"hostname,attr"`
	Timestamp string     `xml:"timestamp,attr"`
	Props     Properties `xml:"properties"`
	Cases     []TestCase `xml:"testcase"`
	SystemOut *CDATA     `xml:"system-out,omitempty"`
}

type Properties struct {
	Properties []Property `xml:"property"`
}

type Property struct {
	Name  string `xml:"name,attr"`
	Value string `xml:"value,attr"`
}

type TestCase struct {
	Name      string  `xml:"name,attr"`
	ClassName string  `xml:"classname,attr"`
	Time      float64 `xml:"time,attr"`

	Failure   *Failure `xml:"failure,omitempty"`
	SystemOut *CDATA   `xml:"system-out,omitempty"`
	SystemErr *CDATA   `xml:"system-err,omitempty"`
}

type Failure struct {
	Message string `xml:"message,attr"`
	Type    string `xml:"type,attr"`
	Content string `xml:",cdata"`
}

type CDATA struct {
	Text string `xml:",cdata"`
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

		if lang == JAVA {
			/* Get current directory */
			currDir, err := os.Getwd()
			if err != nil {
				log.Fatalf("Error getting current directory.\n")
			}

			/* Creates temp directory */
			path, err := os.MkdirTemp(currDir, "tmp_")
			check(err)

			/* Copy spec file to temp directory*/
			srcPathTestFile := currDir + "/" + "tests/java/MainTest.java"
			r, err := os.Open(srcPathTestFile)
			if err != nil {
				log.Fatalf("Error to open tests file.\n")
			}
			defer r.Close()

			w, err := os.Create(path + "/" + "MainTest.java")
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
				log.Fatalf("error to copy MainTest.java file content to tmp dir.\n")
			}

			/* Copy junit jar file to temp directory */
			err = copy(currDir+"/tests/java/junit-platform-console-standalone-1.9.3.jar",
				path+"/junit-platform-console-standalone-1.9.3.jar")
			if err != nil {
				log.Fatalln("Failed to copy junit jar file to tmp directory.")
			}

			/* Creates the actual code file */
			tmpFilePath := path + "/" + "Main.java"
			err = os.WriteFile(tmpFilePath, body, 0755)
			check(err)

			/* Attempts to run tests suit */
			cmd := exec.Command(
				"javac",
				"-cp",
				"junit-platform-console-standalone-1.9.3.jar:.",
				"Main.java",
				"MainTest.java")
			cmd.Dir = path // Set working directory

			// Run command
			if err := cmd.Run(); err != nil {
				log.Fatalln("[ERROR]: could not create jar file: ", err)
			}

			cmd2 := exec.Command(
				"java",
				"-jar",
				"junit-platform-console-standalone-1.9.3.jar",
				"--class-path",
				".",
				"--scan-class-path",
				"--details=verbose",
				"--reports-dir=out",
				"--disable-ansi-colors",
				"--details-theme=unicode")
			cmd2.Dir = path // Set working directory

			// Run command
			if err := cmd2.Run(); err != nil {
				//log.Fatalln("[ERROR]: could not run test file: ", err)
				log.Println(err)
			}

			/* Opens the output report XML file. */
			outputXMLFileTestReport, err := os.Open(path + "/out/TEST-junit-jupiter.xml")
			if err != nil {
				log.Fatalf("[ERROR]: could not open junit XML report file at >> %s.\n", path+"/out/TEST-junit-jupiter.xml")
			}
			defer r.Close()

			stat, err := outputXMLFileTestReport.Stat()
			if err != nil {
				log.Fatalln("[ERROR]: could not return XML file info", err)
			}

			/* Read the file into a byte slice */
			bs := make([]byte, stat.Size())
			_, err = bufio.NewReader(outputXMLFileTestReport).Read(bs)
			if err != nil && err != io.EOF {
				log.Fatal("[ERROR]: could convert XML report into byte array", err)
			}

			var XMLStruct TestSuite

			if err := xml.Unmarshal(bs, &XMLStruct); err != nil {
				log.Fatal("[ERROR]: could not unmarshal XML content to struct: ", err)
			}

			res := make([]JsonResult, len(XMLStruct.Cases))
			for idx := range XMLStruct.Cases {
				before, found := strings.CutSuffix(XMLStruct.Cases[idx].Name, "()")
				if !found {
					log.Fatal("[ERROR]: expected test case to contain ().\n")
				}

				res[idx].Title = before

				if XMLStruct.Cases[idx].Failure != nil {
					res[idx].Failure = XMLStruct.Cases[idx].Failure.Content
					res[idx].Status = "Error"
				} else {
					res[idx].Failure = ""
					res[idx].Status = "Sucess"
				}
			}

			/* Remove the temp directory */
			cmdStr := "rm -rf " + path

			cmd = exec.Command("bash", "-c", cmdStr)
			cmd.Dir = path

			if err := cmd.Run(); err != nil {
				log.Fatal("Error to remove tmp directory: ", err)
			}

			ctx.JSON(200, gin.H{
				"message": res,
			})
		}
	})

	router.Run("localhost:4001")
}
