module Main exposing (main)

import Browser
import Browser.Navigation as Nav
import Html exposing (button, div, text)
import Html.Attributes as Attr
import Html.Events exposing (onClick)
import Http
import Json.Decode as Decode
import Url



-- MODEL


type alias Model =
    { count : Int
    , key : Nav.Key
    , appFromUrl : String
    , apiResponse : Maybe String
    }


init : () -> Url.Url -> Nav.Key -> ( Model, Cmd Msg )
init _ url key =
    ( Model 0 key (extractAppFromUrl url) Nothing, Cmd.none )


extractAppFromUrl : Url.Url -> String
extractAppFromUrl url =
    let
        pathSegments =
            String.split "/" url.path
                |> List.filter (\segment -> segment /= "")
    in
    case pathSegments of
        "watch-app" :: appName :: _ ->
            appName

        _ ->
            ""



-- UPDATE


type Msg
    = Increment
    | Decrement
    | UrlChanged Url.Url
    | SendGreetRequest
    | GotGreetResponse (Result Http.Error ApiResponse)
    | NoOp


type alias ApiResponse =
    { message : String
    }


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Increment ->
            ( { model | count = model.count + 1 }, Cmd.none )

        Decrement ->
            ( { model | count = model.count - 1 }, Cmd.none )

        UrlChanged url ->
            ( { model | appFromUrl = extractAppFromUrl url }, Cmd.none )

        SendGreetRequest ->
            ( model, sendGreetRequest )

        GotGreetResponse (Ok response) ->
            ( { model | apiResponse = Just response.message }, Cmd.none )

        GotGreetResponse (Err _) ->
            ( { model | apiResponse = Nothing }, Cmd.none )

        NoOp ->
            ( model, Cmd.none )


sendGreetRequest : Cmd Msg
sendGreetRequest =
    Http.request
        { method = "GET"
        , headers = []
        , url = "/api"
        , body = Http.emptyBody
        , expect = Http.expectJson GotGreetResponse apiResponseDecoder
        , timeout = Nothing
        , tracker = Nothing
        }


apiResponseDecoder : Decode.Decoder ApiResponse
apiResponseDecoder =
    Decode.map ApiResponse
        (Decode.field "message" Decode.string)



-- VIEW


view : Model -> Browser.Document Msg
view model =
    { title = "Counter App"
    , body =
        [ div [ Attr.class "container" ]
            [ div [] [ text ("hi " ++ model.appFromUrl ++ " from elm") ]
            , div [] [ text ("Count: " ++ String.fromInt model.count) ]
            , button [ onClick Increment ] [ text "+" ]
            , button [ onClick Decrement ] [ text "-" ]
            , button [ onClick SendGreetRequest ] [ text "Send Greet Request!" ]
            , case model.apiResponse of
                Just message ->
                    div [] [ text ("response from api: " ++ message) ]

                Nothing ->
                    div [] []
            ]
        ]
    }



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
