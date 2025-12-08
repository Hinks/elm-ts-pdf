module Main exposing (main)

import Browser
import Browser.Navigation as Nav
import Bytes exposing (Bytes)
import File.Download
import Html exposing (button, div, input, li, text, ul)
import Html.Attributes as Attr
import Html.Events exposing (onClick, onInput)
import Http
import Json.Encode as Encode
import Task
import Time
import Url



-- MODEL


type alias Todo =
    { id : Int
    , text : String
    , completed : Bool
    }


type alias Model =
    { todos : List Todo
    , nextId : Int
    , newTodoText : String
    , key : Nav.Key
    , pdfGenerating : Bool
    , pendingPdfBytes : Maybe Bytes
    }


init : () -> Url.Url -> Nav.Key -> ( Model, Cmd Msg )
init _ _ key =
    ( Model [] 1 "" key False Nothing, Cmd.none )



-- UPDATE


type Msg
    = UpdateNewTodoText String
    | AddTodo
    | ToggleTodo Int
    | DeleteTodo Int
    | GeneratePdf
    | PdfBytesReceived Bytes
    | TimestampReceived Time.Posix
    | PdfReceived (Result Http.Error ())
    | UrlChanged Url.Url
    | NoOp


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UpdateNewTodoText text ->
            ( { model | newTodoText = text }, Cmd.none )

        AddTodo ->
            if String.trim model.newTodoText == "" then
                ( model, Cmd.none )

            else
                ( { model
                    | todos =
                        Todo model.nextId (String.trim model.newTodoText) False
                            :: model.todos
                    , nextId = model.nextId + 1
                    , newTodoText = ""
                  }
                , Cmd.none
                )

        ToggleTodo id ->
            ( { model
                | todos =
                    List.map
                        (\todo ->
                            if todo.id == id then
                                { todo | completed = not todo.completed }

                            else
                                todo
                        )
                        model.todos
              }
            , Cmd.none
            )

        DeleteTodo id ->
            ( { model | todos = List.filter (\todo -> todo.id /= id) model.todos }
            , Cmd.none
            )

        GeneratePdf ->
            if List.isEmpty model.todos then
                ( model, Cmd.none )

            else
                ( { model | pdfGenerating = True }
                , generatePdfRequest model.todos
                )

        PdfBytesReceived bytes ->
            -- Get current time and store bytes temporarily
            ( { model | pendingPdfBytes = Just bytes }
            , Task.perform TimestampReceived Time.now
            )

        TimestampReceived posix ->
            case model.pendingPdfBytes of
                Just bytes ->
                    let
                        timestamp =
                            formatTimestamp posix

                        filename =
                            "todos-" ++ timestamp ++ ".pdf"
                    in
                    ( { model | pdfGenerating = False, pendingPdfBytes = Nothing }
                    , File.Download.bytes filename "application/pdf" bytes
                    )

                Nothing ->
                    ( { model | pdfGenerating = False }, Cmd.none )

        PdfReceived (Ok _) ->
            ( { model | pdfGenerating = False }, Cmd.none )

        PdfReceived (Err _) ->
            ( { model | pdfGenerating = False }
            , Cmd.none
            )

        UrlChanged _ ->
            ( model, Cmd.none )

        NoOp ->
            ( model, Cmd.none )



-- VIEW


view : Model -> Browser.Document Msg
view model =
    { title = "Todo App"
    , body =
        [ div [ Attr.class "container" ]
            [ div [] [ text "My Todo List" ]
            , div []
                [ input
                    [ Attr.type_ "text"
                    , Attr.placeholder "What needs to be done?"
                    , Attr.value model.newTodoText
                    , onInput UpdateNewTodoText
                    , Attr.style "padding" "8px"
                    , Attr.style "margin-right" "8px"
                    , Attr.style "width" "300px"
                    ]
                    []
                , button
                    [ onClick AddTodo
                    , Attr.style "padding" "8px 16px"
                    ]
                    [ text "Add Todo" ]
                ]
            , ul
                [ Attr.style "list-style" "none"
                , Attr.style "padding" "0"
                , Attr.style "margin-top" "20px"
                ]
                (List.map (viewTodo model) model.todos)
            , div
                [ Attr.style "margin-top" "20px" ]
                [ button
                    [ onClick GeneratePdf
                    , Attr.disabled (model.pdfGenerating || List.isEmpty model.todos)
                    , Attr.style "padding" "10px 20px"
                    , Attr.style "background-color" "#4CAF50"
                    , Attr.style "color" "white"
                    , Attr.style "border" "none"
                    , Attr.style "cursor"
                        (if model.pdfGenerating || List.isEmpty model.todos then
                            "not-allowed"

                         else
                            "pointer"
                        )
                    , Attr.style "font-size" "16px"
                    ]
                    [ text
                        (if model.pdfGenerating then
                            "Generating PDF..."

                         else
                            "Create PDF"
                        )
                    ]
                ]
            ]
        ]
    }


viewTodo : Model -> Todo -> Html.Html Msg
viewTodo _ todo =
    li
        [ Attr.style "padding" "8px"
        , Attr.style "margin-bottom" "8px"
        , Attr.style "display" "flex"
        , Attr.style "align-items" "center"
        , Attr.style "background-color"
            (if todo.completed then
                "#f0f0f0"

             else
                "#fff"
            )
        ]
        [ input
            [ Attr.type_ "checkbox"
            , Attr.checked todo.completed
            , onClick (ToggleTodo todo.id)
            , Attr.style "margin-right" "12px"
            ]
            []
        , div
            [ Attr.style "flex" "1"
            , Attr.style "text-decoration"
                (if todo.completed then
                    "line-through"

                 else
                    "none"
                )
            , Attr.style "color"
                (if todo.completed then
                    "#999"

                 else
                    "#000"
                )
            ]
            [ text todo.text ]
        , button
            [ onClick (DeleteTodo todo.id)
            , Attr.style "padding" "4px 8px"
            , Attr.style "margin-left" "8px"
            , Attr.style "background-color" "#ff4444"
            , Attr.style "color" "white"
            , Attr.style "border" "none"
            , Attr.style "cursor" "pointer"
            ]
            [ text "Delete" ]
        ]



-- HTTP


todoEncoder : Todo -> Encode.Value
todoEncoder todo =
    Encode.object
        [ ( "id", Encode.int todo.id )
        , ( "text", Encode.string todo.text )
        , ( "completed", Encode.bool todo.completed )
        ]


generatePdfRequest : List Todo -> Cmd Msg
generatePdfRequest todos =
    Http.request
        { method = "POST"
        , url = "/pdf"
        , headers = []
        , body =
            Http.jsonBody
                (Encode.object
                    [ ( "todos", Encode.list todoEncoder todos )
                    ]
                )
        , expect = Http.expectBytesResponse handlePdfResponse (resolve Ok)
        , timeout = Nothing
        , tracker = Nothing
        }


resolve : (Bytes -> Result String a) -> Http.Response Bytes -> Result Http.Error a
resolve toResult response =
    case response of
        Http.BadUrl_ url_ ->
            Err (Http.BadUrl url_)

        Http.Timeout_ ->
            Err Http.Timeout

        Http.NetworkError_ ->
            Err Http.NetworkError

        Http.BadStatus_ metadata _ ->
            Err (Http.BadStatus metadata.statusCode)

        Http.GoodStatus_ _ body ->
            Result.mapError Http.BadBody (toResult body)


handlePdfResponse : Result Http.Error Bytes -> Msg
handlePdfResponse result =
    case result of
        Ok bytes ->
            PdfBytesReceived bytes

        Err error ->
            PdfReceived (Err error)



-- TIMESTAMP FORMATTING


formatTimestamp : Time.Posix -> String
formatTimestamp posix =
    let
        year =
            String.fromInt (Time.toYear Time.utc posix)

        month =
            String.padLeft 2 '0' (String.fromInt (Time.toMonth Time.utc posix |> monthToInt))

        day =
            String.padLeft 2 '0' (String.fromInt (Time.toDay Time.utc posix))

        hour =
            String.padLeft 2 '0' (String.fromInt (Time.toHour Time.utc posix))

        minute =
            String.padLeft 2 '0' (String.fromInt (Time.toMinute Time.utc posix))

        second =
            String.padLeft 2 '0' (String.fromInt (Time.toSecond Time.utc posix))
    in
    year ++ "-" ++ month ++ "-" ++ day ++ "-" ++ hour ++ minute ++ second


monthToInt : Time.Month -> Int
monthToInt month =
    case month of
        Time.Jan ->
            1

        Time.Feb ->
            2

        Time.Mar ->
            3

        Time.Apr ->
            4

        Time.May ->
            5

        Time.Jun ->
            6

        Time.Jul ->
            7

        Time.Aug ->
            8

        Time.Sep ->
            9

        Time.Oct ->
            10

        Time.Nov ->
            11

        Time.Dec ->
            12



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



-- URL HANDLING


onUrlRequest : Browser.UrlRequest -> Msg
onUrlRequest _ =
    NoOp


onUrlChange : Url.Url -> Msg
onUrlChange url =
    UrlChanged url



-- MAIN


main : Program () Model Msg
main =
    Browser.application
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        , onUrlRequest = onUrlRequest
        , onUrlChange = onUrlChange
        }
