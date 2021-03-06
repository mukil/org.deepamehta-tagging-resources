CKEDITOR.dialog.add( 'mathjaxDialog', function( editor ) {

    var _this = this
    var DELIMITER = "$$"

    _this.editingFormulaId = ""

    return {
        title : 'Math Input Dialog',
        minWidth : 400,
        minHeight : 340,
        contents: [
            {
                id: 'input-tab',
                label: 'Eingabe',
                elements:[
                    {   //input element for the width
                        type: 'html',
                        html: '<span class="label">Mathe-Eingabefenster (Tippe LaTeX-Code)</span><br/>'
                            + '<textarea id="math-input-dialog" name="math"></textarea>',
                        setup: function( element ) {
                            // console.log("setting up " + element.getText())
                            this.setValue( element.getText() )
                        },
                        commit: function( element ) {
                            element.setText( this.getValue() )
                        }
                    }, {
                        type: 'html',
                        html: '<span class="label">MathJax Preview</span><br/>'
                            + '<div id="math-live-preview"></div>',
                        setup: function (element) {
                            var textarea = editor.document.getById("math-input-dialog")
                            var livePreview = editor.document.getById("math-live-preview")
                            if (livePreview != undefined) livePreview.setText("") // clear preview
                            // register live-preview handler
                            if (textarea) {
                                // var t = textarea.$
                                var t = textarea.$
                                // initial preview-build up
                                livePreview.setText(DELIMITER + t.value + DELIMITER)
                                // render preview after every keychange
                                t.onkeyup = function(e) {
                                    livePreview.setText(DELIMITER + t.value + DELIMITER)
                                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, "math-live-preview"])
                                }
                            }
                        }
                    }
                ]
            }, {
                id: 'help-tab',
                label: 'Hilfe (LaTeX-Spickzettel)',
                elements:[
                    {
                        type: 'html',
                        html: '<b>LaTeX Spickzettel</b></br></br><p>Aktuell k&ouml;nnen wir euch leider nur '
                            + 'auf die <a target="_blank" '
                            + 'href="http://de.wikipedia.org/wiki/Hilfe:TeX">Wikipedia-Hilfe Seite für '
                            + 'TeX</a><br/>verweisen, dort findet Ihr einen gut strukturierten Einstieg.</p><br/><br/>'
                            + '<b>Eingabehilfe</b></br></br>'
                            + '<p>Als Alternative k&ouml;nnen wir euch den <a '
                            + 'href="http://www.codecogs.com/latex/eqneditor.php" target="_blank" '
                            + 'title="Zum CodeCogs-LaTeX-Editor">CodeCogs-LaTeX-Editor</a> empfehlen, <br/>'
                            + 'damit k&ouml;nnt Ihr euch die Formeln erst interaktiv zusammenklicken um den <br/> '
                            + 'generierten LaTeX-Code hier einfach in die "Eingabe" einzuf&uuml;gen.</p>'
                    }
                ]
            }
        ], onLoad: function() {

            // initial pop-up
            this.setupContent(editor.document.createText(""))

        }, onShow: function() {

            this.insertMode = true
            // var selection = editor.getSelection()
            // var element = selection.getStartElement()
            var newElement = undefined
            var latexSource = "" // this is what we need to edit this math-formula
            // new formula selection mode to find our current math-output/div container
            if (typeof CKEDITOR.app_model.getSelectedFormula() !== 'undefined') {
                newElement = CKEDITOR.app_model.getSelectedFormula()
                latexSource = newElement.getAttribute("data-tex")
                this.insertMode = false
            } else {
                this.insertMode = true
            }

            if (!this.insertMode) {
                // override verbose html generated and replace it with tex-source
                setInputValue(latexSource)
                // setup live-preview
                var previewData = DELIMITER + latexSource + DELIMITER
                setPreviewValue(previewData)
                this.setupContent(newElement)
            } else {
                // setting up blank content without delimiters
                setInputValue("")
                setPreviewValue("")
                this.setupContent(editor.document.createText(""))
            }

            function setInputValue (val) {
                editor.document.getById('math-input-dialog').$.value = val
            }

            function setPreviewValue (val) {
                var preview = editor.document.getById("math-live-preview")
                preview.setText(val)
            }

            setTimeout(function(e) {
                // set ui-focus to our newly created input dialog
                $('#math-input-dialog')[0].focus()
            }, 300)

            // render live-preview
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "math-live-preview"])

        }, onOk: function () {

            // var selection = editor.getSelection()
            // var element = selection.getStartElement()
            var newElement = undefined
            // new formula selection mode to find our current math-output/div container
            if (typeof CKEDITOR.app_model.getSelectedFormula() !== 'undefined') {
                newElement = CKEDITOR.app_model.getSelectedFormula()
                this.insertMode = false
            } else {
                this.insertMode = true
            }

            var dialog = this
            var math = editor.document.getById('math-input-dialog').$.value
            if (math === "") return undefined

            var preview, content = undefined

            if (dialog.insertMode) {

                // Note: Here we deal with the CKEDitor API to create nodes
                // this element is our mathjax-source container
                content = editor.document.createElement('div')
                    content.setAttribute('class', 'math-output')
                    content.setAttribute('title', 'Mathe-Formel (MathJax)')
                    content.setAttribute('data-tex', math)
                    content.setAttribute('contenteditable', false)
                // the contents of this element get replaced by the mathjax-renderer
                preview = editor.document.createElement('div')
                    preview.setAttribute('class', 'math-preview')
                    preview.setText(DELIMITER + math + DELIMITER)

                content.append(preview) // content is a CKEditor-Node
                editor.insertElement( content )

            } else {

                // Note: Here we deal with the ordinary DOM API to update nodes
                // update data-tex attr
                if (newElement.getAttribute('class').indexOf('math-output') != -1) {
                    newElement.setAttribute('data-tex', math)
                    // the contents of this element get replaced by the mathjax-renderer
                    preview = window.document.createElement('div')
                    preview.setAttribute('class', 'math-preview')
                    preview.textContent = DELIMITER + math + DELIMITER
                    // append updated preview object
                    newElement.appendChild(preview) // newElement is a DOM-Node while preview is a CKeditor-Node
                } else {
                    throw new Error ("Sorry, we could not update your formula.")
                }

                // fixme: dialog.commitContent() suddenly does not work as expected anymore, duplicating formula now
                // editor.insertElement( newElement )

            }

            function getMathJaxElementById (id) {
                var allJax = MathJax.Hub.getAllJax()
                for (var obj in allJax) {
                    var element = allJax[obj]
                    if (element.inputID === id) return element
                }
                return undefined
            }

            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "resource_input"])
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "add_resource"])

        }, onHide: function() {
            // console.log("just hiding the dialog, typesetting math in any case..")
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "resource_input"])
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "add_resource"])

        }, onCancel: function() {
            // console.log("just cancelled the dialog, typesetting math in any case..")
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "resource_input"])
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "add_resource"])
        }
    }
});
